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
3. Inicia el frontend desde este repositorio con `npm run dev`.
4. Abre [http://localhost:3000](http://localhost:3000).

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
- suscripciones realtime para `track.updated`, `telemetry.received`, `command.status.changed`, `alert.created`, `alert.updated`, `mission.updated` y `layer.updated`

## Comportamiento actual de la UI

- `/operations` sigue siendo el mapa COP principal y ahora hidrata un runtime provider en vivo en lugar de depender de polling sobre un bootstrap mock.
- `/alerts` soporta acciones de ACK y resolución contra backend con refresco realtime.
- `/incidents` conserva el tablero actual de incidentes y ahora incluye visibilidad del estado de misiones del backend.
- `/assets`, `/alerts/[id]`, `/assets/[id]` y `/incidents/[id]` mantienen sus rutas actuales y leen datos a través del gateway conectado al backend.

## Supuestos actuales

- El frontend ya está tipado para el evento `device.status.changed`, pero el gateway realtime actual del backend todavía no lo emite. El cliente queda preparado para consumirlo cuando el backend lo publique.
- Las actualizaciones del ciclo de vida de comandos se refrescan desde la lista de comandos porque el payload realtime actual viene indexado por `commandId` del backend y no por el `id` de la tabla.
- El transporte mock anterior sigue existiendo en el repositorio como referencia o fallback local, pero la ruta activa de la aplicación usa la capa de integración con backend.

## Comandos útiles

```bash
npm install
npm run dev
npm run lint
npm run build
```
