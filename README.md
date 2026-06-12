# Gungnir Frontend

Frontend `Next.js 16` para la consola operacional de Gungnir. La app funciona como BFF autenticado contra el backend, hidrata el mapa COP desde `operations/bootstrap` y mantiene la experiencia viva con REST, `Socket.IO` y overlays geoespaciales.

## Estado actual

- runtime principal en `/operations` con mapa, sidebars operacionales y capas live
- autenticacion resuelta en el frontend mediante cookies httpOnly y proxy `/api/backend/*`
- lectura tipada de `assets`, `alerts`, `incidents`, `layers` y `timeline`
- overlays geoespaciales para incendios, sismos y ciclo dia/noche
- workspace visual actualizado para dispositivos, detalle rapido de activos y panel de capas tipo `rail + detail`

## Stack

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `socket.io-client@4.8.3`
- `typescript@5`
- `vitest@4`
- `pnpm@11.5.0`

## Requisitos

- Node.js 20+
- Corepack habilitado
- backend de Gungnir levantado localmente

## Variables de entorno

Parte desde `.env.example` y define al menos:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/realtime
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Opcionalmente, para server-side dentro de Docker o despliegue interno:

```bash
BACKEND_API_URL=http://localhost:4000/api
```

Notas:

- `NEXT_PUBLIC_API_URL` es la base REST publica que consumira el navegador.
- `BACKEND_API_URL` permite que los route handlers server-side hablen con el backend aunque la URL publica sea distinta.
- `NEXT_PUBLIC_WS_URL` apunta al namespace realtime del backend.
- `INTERNAL_TEST_DATA_WRITE_ENABLED` debe permanecer en `false` salvo entornos aislados de desarrollo o test.

## Desarrollo local

1. Levanta el backend desde `C:\Users\juan.cornejo\Documents\gungnir back`.
2. Ejecuta migraciones y seed si hace falta.
3. Instala dependencias:

```bash
corepack enable
corepack pnpm install
```

4. Inicia el frontend:

```bash
corepack pnpm dev
```

5. Abre [http://localhost:3000](http://localhost:3000).

## Modo recomendado en Windows

El flujo validado hoy para evitar problemas de red entre Windows y WSL/Docker es:

1. `gungnir-back` nativo en Windows en `http://localhost:4000`
2. `gugnir v2` nativo en Windows en `http://localhost:3000`
3. `postgres`, `redis` y `mosquitto` levantados con Compose dentro de WSL, publicados a Windows en `5433`, `6380` y `1884`

Variables esperadas en `.env.local`:

```bash
BACKEND_API_URL=http://localhost:4000/api
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/realtime
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Checks utiles:

- `http://localhost:3000`
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/docs`

Credenciales seed:

- `admin@gungnir.local`
- `admin12345`

## Arquitectura resumida

### BFF y sesion

El frontend no expone tokens crudos al cliente. La sesion se maneja con:

- `POST /api/session/login`
- `GET /api/session/me`
- `POST /api/session/logout`
- `ALL /api/backend/*`

El proxy autenticado reintenta refresh cuando el backend responde `401`.

### Datos operacionales

El estado visible de la app sale de:

- `GET /api/v1/operations/bootstrap`
- `GET /api/v1/operations/snapshot`
- `GET /api/v1/assets`
- `GET /api/v1/alerts`
- `GET /api/v1/incidents`
- `GET /api/v1/layers`
- `GET /api/v1/timeline`

La adaptacion DTO -> dominio vive principalmente en:

- [src/lib/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api.ts)
- [src/lib/api-server.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api-server.ts)
- [src/types/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/api.ts)
- [src/types/domain.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/domain.ts)

### Runtime del mapa

La experiencia principal vive en:

- [src/app/operations/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/operations/page.tsx)
- [src/widgets/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage-client.tsx)
- [src/widgets/map-stage/operations-runtime-provider.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/operations-runtime-provider.tsx)

Capacidades actuales del workspace:

- seleccion y seguimiento de activos
- panel de capas por seccion con toggles y presets
- sidebars separadas para lista de dispositivos y detalle del activo
- acciones rapidas sobre activos y comandos enviados al backend
- detalle de telemetria, heading, referencia y feeds RTSP placeholder
- iconografia dedicada por tipo de dispositivo en `public/assets/device-icons`

## Geoespacial

Hazards activos:

- `layer-fire-intel`: hotspots `NASA FIRMS`
- `layer-earthquakes`: sismos `USGS`
- `layer-weather-hazards`: hazards publicados por backend
- `day_night`: overlay calculado en cliente

Endpoints frontend:

- `GET /api/geospatial/fire-hotspots`
- `GET /api/geospatial/earthquakes`
- `GET /api/v1/geospatial/fire-hotspots`

Comportamiento esperado:

- las capas se cargan bajo demanda
- el cliente cachea resultados mientras la capa siga activa
- el panel muestra conteos y estado de carga por layer
- el runtime puede superponer hazards junto con capas operacionales del backend

Ejemplo de URL compartible:

```text
http://localhost:3000/operations?lat=-36.8251&lon=0&zoom=7.20&layers=news_intel,earthquakes,fires,weather,day_night
```

Aliases soportados en `layers`:

- `fires` o `active_fires` -> `layer-fire-intel`
- `earthquakes` -> `layer-earthquakes`
- `weather` o `weather_hazards` -> `layer-weather-hazards`
- `day_night` -> overlay dia/noche

## Legacy y limites conocidos

- El contrato websocket esta documentado, pero el runtime de stream largo sigue dependiendo del backend realtime y no de un host WS propio en Next.
- Sigue existiendo material mock/replay en `src/shared/mock` y `src/shared/transport/mock-operational-transport.ts` como referencia contractual y de fixtures.
- La superficie `api/internal/test-data` sigue presente para desarrollo, pero hoy no debe tratarse como una API operativa de produccion.
- Las mutaciones internas de `api/internal/test-data` ahora requieren `INTERNAL_TEST_DATA_WRITE_ENABLED=true` o `NODE_ENV=test`.
- El cliente esta tipado para `device.status.changed`, aunque el backend actual todavia no lo emite.

## Comandos utiles

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

## Verificacion recomendada

Antes de fusionar cambios importantes:

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

## Docker

```bash
docker build -t gungnir-front .
docker run --rm -p 3000:3000 \
  -e BACKEND_API_URL=http://backend:4000/api \
  -e NEXT_PUBLIC_API_URL=https://api.example.com/api \
  -e NEXT_PUBLIC_WS_URL=https://api.example.com/realtime \
  -e NEXT_PUBLIC_SITE_URL=https://app.example.com \
  gungnir-front
```

## Documentacion relacionada

- estado funcional: [docs/feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
- referencia del repo: [docs/project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
- dependencias y servicios: [docs/dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
- revision de seguridad: [docs/security-review.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/security-review.md)
- roadmap de refactor: [docs/refactor-roadmap.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/refactor-roadmap.md)
- QA: [docs/qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)
- contratos REST y WebSocket: [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md) y [docs/contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)

## Publicacion

El repo incluye workflow para publicar imagen Docker en `GHCR` desde `.github/workflows/publish-image.yml`.
