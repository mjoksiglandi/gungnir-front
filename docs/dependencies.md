# Dependencias y servicios

Fecha de corte: `2026-06-04`

## Resumen

Este documento registra las dependencias tecnicas, integraciones externas y decisiones operacionales que hoy sostienen el frontend.

## Runtime principal

### `next@16.2.6`

- framework principal
- App Router
- Route Handlers
- build con Turbopack

Uso visible:

- paginas bajo `src/app`
- endpoints bajo `src/app/api`
- boundaries server/client del runtime operacional

### `react@19.2.4` y `react-dom@19.2.4`

- modelo de componentes
- rendering de cliente y servidor
- base de la UI operacional

### `leaflet@1.9.4`

- primitives del mapa
- markers, polygons, polylines y tooltips

### `react-leaflet@5.0.0`

- integracion de Leaflet con React
- composicion declarativa de capas y overlays

### `socket.io-client@4.8.3`

- sincronizacion realtime del runtime operacional

### `maplibre-gl@5.24.0`

- dependencia presente en runtime
- hoy no es la base principal del mapa mostrado en las superficies revisadas
- conviene reevaluar su necesidad cuando cierre la refactorizacion actual del mapa

## Tooling de desarrollo

### `typescript`

- contratos compartidos
- tipado del dominio y DTOs

### `eslint@^9` y `eslint-config-next@16.2.6`

- validacion estatica del codigo
- reglas alineadas con Next.js 16

### `vitest@^4.1.7`

- suite unitaria y de helpers

### Tipos

- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@types/leaflet`
- `@types/geojson`

## Integraciones externas

### Backend Gungnir

Rol:

- fuente principal de autenticacion, snapshot operacional y datos en vivo

Superficies de integracion:

- `BACKEND_API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Puntos de entrada en codigo:

- [src/lib/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api.ts)
- [src/lib/api-server.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api-server.ts)
- [src/app/api/backend/[...path]/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/backend/[...path]/route.ts)

### NASA FIRMS

Rol:

- hotspots externos de incendios activos

Codigo:

- [src/shared/feeds/nasa-firms-hotspots.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/feeds/nasa-firms-hotspots.ts)

### USGS

Rol:

- feed de sismos para overlays geoespaciales

Codigo:

- [src/shared/geospatial/earthquake-layer.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/geospatial/earthquake-layer.ts)

## Dependencias operacionales implicitas

### Contratos canonicos

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)
- [src/shared/contracts/rest.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/rest.ts)
- [src/shared/contracts/websocket.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/websocket.ts)

Rol:

- definir shapes compartidos entre UI, BFF y documentacion contractual

### Material mock y replay

- [src/shared/mock/scenario.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario.ts)
- [src/shared/mock/scenario-replay.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario-replay.ts)
- [src/shared/transport/mock-operational-transport.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport/mock-operational-transport.ts)

Rol actual:

- fixtures
- referencia contractual
- legado util para pruebas y comparacion

No deben leerse como el runtime principal actual.

## Seguridad y mantenimiento

- el workspace usa override de `postcss` en [pnpm-workspace.yaml](C:/Users/juan.cornejo/Documents/gugnir%20v2/pnpm-workspace.yaml) para mantener la version parcheada
- `INTERNAL_TEST_DATA_WRITE_ENABLED` controla las mutaciones internas de test-data
- el set recomendado de verificacion incluye `audit`, `lint`, `test` y `build`

## Comandos de validacion

```bash
corepack pnpm audit --prod
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```
