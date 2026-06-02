# Frontend de Gungnir

Frontend en `Next.js 16` para la plataforma C4 / Common Operational Picture de Gungnir. La aplicación actual preserva la experiencia visual, el enrutamiento y la arquitectura principal del mapa, mientras conecta el flujo de datos con el backend en `NestJS` y el namespace realtime `/realtime` basado en `Socket.IO`.

## Stack

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `socket.io-client@4`
- `typescript@5`
- `pnpm@11.5.0` mediante Corepack

## Entorno

Copia los valores de `.env.example` en tu archivo de entorno local:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/realtime
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` corresponde a la base REST del backend e incluye `/api`. `NEXT_PUBLIC_WS_URL` apunta al namespace `Socket.IO` del backend.

## Ejecución de frontend y backend

1. Inicia el backend desde `C:\Users\juan.cornejo\Documents\gugnir back`.
2. Ejecuta migraciones y seed del backend si hace falta.
3. Habilita Corepack si pnpm no esta disponible: `corepack enable`.
4. Instala dependencias con `corepack pnpm install`.
5. Inicia el frontend desde este repositorio con `corepack pnpm dev`.
6. Abre [http://localhost:3000](http://localhost:3000).

Credenciales del seed:

- `admin@gungnir.local`
- `admin12345`

## Notas de integración

El frontend usa ahora un cliente tipado centralizado en [src/lib/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api.ts) y contratos tipados de backend y dominio en:

- [src/types/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/api.ts)
- [src/types/domain.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/domain.ts)
- [src/lib/ws.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/ws.ts)

La autenticación se resuelve mediante route handlers de Next que conservan los tokens del backend en cookies:

- `POST /api/session/login`
- `GET /api/session/me`
- `POST /api/session/logout`
- `ALL /api/backend/*` para proxy autenticado contra el backend con reintento de refresh

Esto evita exponer tokens crudos a los componentes del navegador y, al mismo tiempo, permite que la UI consuma endpoints protegidos.

## Cobertura operativa

La UI actual ya consume estado respaldado por el backend para:

- bootstrap y snapshot COP desde `/api/v1/operations/*`
- autenticación vía `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`
- dispositivos, tracks actuales, historial de tracks, telemetría y comandos
- alertas con refresco realtime y acciones de ACK y resolución
- misiones visibles en el workspace de coordinación y en el panel lateral del activo seleccionado
- geocercas y capas de mapa renderizadas en el mapa operacional
- capas de amenazas naturales desde `map_layers` / `layer_features`: incendios activos, sismos, alertas meteorologicas y ciclo dia/noche
- suscripciones realtime para `track.updated`, `telemetry.received`, `command.status.changed`, `alert.created`, `alert.updated`, `mission.updated` y `layer.updated`

## Comportamiento actual de la UI

- `/operations` sigue siendo el mapa COP principal y ahora hidrata un runtime provider en vivo en lugar de depender de polling sobre un bootstrap mock.
- El panel de capas incluye el grupo `Natural Hazards`, con toggles independientes, conteos por GeoJSON cargado y renderizado directo sobre el mapa.
- El panel `Layers` usa ahora un layout tipo `rail + detail`: una columna lateral compacta para categorías (`Display`, `Hazard`, `Aviation`, `Threat`, etc.) y un panel de detalle a la derecha para los sublayers y toggles de la sección activa.
- Los popups operativos del mapa comparten ahora un mismo estilo visual compacto y translúcido. En NOTAMs se prioriza el identificador como título y solo el bloque `Detail` como contenido principal.
- `/alerts` soporta acciones de ACK y resolución contra backend con refresco realtime.
- `/incidents` conserva el tablero actual de incidentes y ahora incluye visibilidad del estado de misiones del backend.
- `/assets`, `/alerts/[id]`, `/assets/[id]` y `/incidents/[id]` mantienen sus rutas actuales y leen datos a través del gateway conectado al backend.

## Troubleshooting

- Si el login no avanza y `POST /api/session/login` responde `503`, el frontend no está pudiendo alcanzar el backend en `http://localhost:4000/api`. Levanta primero `gungnir back` antes de probar `/operations`.

## Capas Natural Hazards

El frontend consume las capas normalizadas por el backend de Gungnir. El backend mantiene el modelo existente de `map_layers` y `layer_features`; cada fuente externa escribe features GeoJSON normalizadas en almacenamiento de capas.

Capas soportadas:

- `layer-fire-intel`: incendios activos NASA FIRMS, visible como `Active Fires`.
- `layer-earthquakes`: sismos USGS M2.5+ recientes, visible como `Earthquakes`.
- `layer-weather-hazards`: eventos NASA EONET y alertas NOAA/NWS, visible como `Weather Hazards`.
- `day_night`: overlay calculado en cliente para el ciclo dia/noche.

Endpoints esperados del backend:

```bash
GET /api/map-layers/layer-fire-intel/geojson
GET /api/map-layers/layer-earthquakes/geojson
GET /api/map-layers/layer-weather-hazards/geojson
GET /api/map-layers
```

Todas las llamadas pasan por el proxy autenticado del frontend (`/api/backend/*`) y usan la misma sesion Bearer/cookie de la app.

Comportamiento en el mapa:

- Las capas se cargan solo cuando se habilitan por primera vez.
- Los resultados quedan cacheados en memoria y se refrescan mientras la capa siga activa.
- Los conteos del panel salen de `featureCollection.features.length`.
- Los popups muestran propiedades normalizadas por categoria: fuego, sismo o clima.
- Los NOTAMs usan un popup reducido: título con identificador y cuerpo centrado en `Detail`, para no saturar el mapa con metadata secundaria.
- Si el backend aun no lista estas capas en `GET /api/map-layers`, el frontend agrega definiciones fallback para que los toggles sigan disponibles y apunten a los IDs canonicos.

URL compartible de ejemplo:

```text
http://localhost:3000/operations?lat=-36.8251&lon=0&zoom=7.20&layers=news_intel,earthquakes,fires,weather,day_night
```

Aliases soportados en `layers`:

- `fires` o `active_fires` habilita `layer-fire-intel`.
- `earthquakes` habilita `layer-earthquakes`.
- `weather` o `weather_hazards` habilita `layer-weather-hazards`.
- `day_night` habilita el overlay dia/noche.

## Supuestos actuales

- El frontend ya está tipado para el evento `device.status.changed`, pero el gateway realtime actual del backend todavía no lo emite. El cliente queda preparado para consumirlo cuando el backend lo publique.
- Las actualizaciones del ciclo de vida de comandos se refrescan desde la lista de comandos porque el payload realtime actual viene indexado por `commandId` del backend y no por el `id` de la tabla.
- El transporte mock anterior sigue existiendo en el repositorio como referencia o fallback local, pero la ruta activa de la aplicación usa la capa de integración con backend.

## Comandos útiles

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

## QA y documentaciÃ³n operativa

- estado de features y roadmap inmediato: [docs/feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
- plan de QA y checklist manual: [docs/qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)

## Docker

El frontend se puede empaquetar para homelab o despliegue interno con:

```bash
docker build -t gungnir-front .
docker run --rm -p 3000:3000 \
  -e BACKEND_API_URL=http://backend:4000/api \
  -e NEXT_PUBLIC_API_URL=https://api.example.com/api \
  -e NEXT_PUBLIC_WS_URL=https://api.example.com/realtime \
  -e NEXT_PUBLIC_SITE_URL=https://app.example.com \
  gungnir-front
```

`BACKEND_API_URL` queda disponible para llamadas server-side desde Next dentro del contenedor. Las variables `NEXT_PUBLIC_*` se compilan dentro del bundle del frontend y deben apuntar a las URLs publicas que vera el navegador.

Para despliegue conjunto con backend e infraestructura, el compose principal vive en [../gungnir back/docker-compose.homelab.yml](C:/Users/juan.cornejo/Documents/gugnir%20back/docker-compose.homelab.yml).

## Publicacion de imagenes

El repositorio incluye el workflow [`publish-image.yml`](./.github/workflows/publish-image.yml) para construir y publicar la imagen Docker en `GHCR`.

- imagen: `ghcr.io/<github-owner>/gungnir-front`
- triggers: cada `push`, tags `v*` y ejecucion manual
- tags publicados: nombre de rama, SHA del commit y `latest` solo en la rama por defecto

El workflow usa `GITHUB_TOKEN` con permiso `packages: write`, por lo que no necesita secrets extra para publicar la imagen.

Si quieres personalizar las URLs publicas compiladas dentro del frontend, puedes definir GitHub repository variables:

- `BACKEND_API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_SITE_URL`

Si no existen, el workflow usa defaults de placeholder para que el build no quede bloqueado.
