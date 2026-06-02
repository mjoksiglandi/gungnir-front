# Referencia del proyecto

## Resumen

`gugnir-console-front` es la consola web operacional de Gungnir. Hoy corre como frontend `Next.js 16` conectado a backend real, con BFF autenticado, mapa live, sidebars operacionales y soporte geoespacial para hazards.

## Fuente de verdad

### Dominio y contratos

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)
- [src/shared/contracts/operations-map.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operations-map.ts)
- [src/shared/contracts/rest.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/rest.ts)
- [src/shared/contracts/websocket.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/websocket.ts)

Entidades centrales:

- `Asset`
- `Alert`
- `Incident`
- `GeoLayer`
- `TimelineEvent`
- `OperationalScenario`
- `MapStageBootstrap`

### Adaptacion API -> dominio

- [src/types/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/api.ts)
- [src/types/domain.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/domain.ts)
- [src/lib/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api.ts)
- [src/lib/api-server.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api-server.ts)

## Arquitectura actual

### App Router y rutas UI

Paginas principales:

- `/`
- `/login`
- `/operations`
- `/assets`
- `/assets/[id]`
- `/alerts`
- `/alerts/[id]`
- `/incidents`
- `/incidents/[id]`

Archivos clave:

- [src/app/layout.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/layout.tsx)
- [src/app/operations/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/operations/page.tsx)
- [src/app/assets/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/assets/page.tsx)
- [src/app/alerts/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/alerts/page.tsx)
- [src/app/incidents/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/incidents/page.tsx)

### Sesion y BFF

La autenticacion se resuelve en el frontend con cookies y proxy autenticado:

- [src/app/api/session/login/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/session/login/route.ts)
- [src/app/api/session/me/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/session/me/route.ts)
- [src/app/api/session/logout/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/session/logout/route.ts)
- [src/app/api/backend/[...path]/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/backend/[...path]/route.ts)

Responsabilidades:

- guardar tokens del backend en cookies httpOnly
- resolver refresh token en el lado servidor
- evitar exponer credenciales crudas a componentes cliente
- unificar acceso desde browser hacia endpoints protegidos

### Datos operacionales

Entrada principal:

- [src/shared/data/operations-map-bootstrap.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operations-map-bootstrap.ts)
- [src/shared/data/operational-data.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts)

Superficies REST actuales:

- `/api/v1/operations/bootstrap`
- `/api/v1/operations/snapshot`
- `/api/v1/assets`
- `/api/v1/assets/[id]`
- `/api/v1/alerts`
- `/api/v1/alerts/[id]`
- `/api/v1/incidents`
- `/api/v1/incidents/[id]`
- `/api/v1/layers`
- `/api/v1/layers/[id]`
- `/api/v1/timeline`
- `/api/v1/timeline/[id]`

Observacion importante:

- `operationalDataGateway` ya actua como fachada del backend para lectura.
- Algunas mutaciones `replaceSnapshot`, `upsert*` y `subscribe` siguen expuestas por compatibilidad interna, pero no representan el camino operativo principal actual.

### Runtime del mapa

Componentes y hooks principales:

- [src/widgets/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage-client.tsx)
- [src/widgets/map-stage/map-stage-canvas.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/map-stage-canvas.tsx)
- [src/widgets/map-stage/map-stage-control-dock.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/map-stage-control-dock.tsx)
- [src/widgets/map-stage/map-stage-device-sidebar.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/map-stage-device-sidebar.tsx)
- [src/widgets/map-stage/map-stage-asset-sidebar.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/map-stage-asset-sidebar.tsx)
- [src/widgets/map-stage/use-map-stage-ui.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/use-map-stage-ui.ts)
- [src/widgets/map-stage/use-map-stage-selection.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/use-map-stage-selection.ts)
- [src/widgets/map-stage/use-live-operations-bootstrap.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/use-live-operations-bootstrap.ts)
- [src/widgets/map-stage/use-geospatial-overlays.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/use-geospatial-overlays.ts)
- [src/widgets/map-stage/operations-runtime-provider.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/operations-runtime-provider.tsx)

Capacidades visibles del shell:

- panel de capas con layout `rail + detail`
- filtros y busqueda de dispositivos
- iconografia dedicada por tipo de activo via [src/widgets/map-stage/device-visuals.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/device-visuals.ts)
- panel rapido de activo con metricas, heading, referencia, link state y RTSP placeholders via [src/widgets/map-stage/asset-quick-panel.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage/asset-quick-panel.ts)
- follow asset, route mode, geofences dibujadas y center on map
- envio de comandos al backend desde el sidebar del activo

### Geoespacial

Feeds y loaders:

- [src/shared/feeds/nasa-firms-hotspots.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/feeds/nasa-firms-hotspots.ts)
- [src/shared/geospatial/fire-hotspot-layer.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/geospatial/fire-hotspot-layer.ts)
- [src/shared/geospatial/earthquake-layer.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/geospatial/earthquake-layer.ts)

Endpoints asociados:

- `/api/geospatial/fire-hotspots`
- `/api/geospatial/earthquakes`
- `/api/v1/geospatial/fire-hotspots`

Politica actual:

- hazards externos permanecen fuera de `OperationalScenario`
- los layers operacionales canonicos siguen viniendo del backend
- el cliente mezcla ambos planos solo al renderizar el mapa

## Legacy que sigue en el repo

Estos modulos ya no describen el runtime principal, pero aun existen por contrato, fixtures o tooling:

- [src/shared/mock/scenario.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario.ts)
- [src/shared/mock/scenario-replay.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario-replay.ts)
- [src/shared/transport/mock-operational-transport.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport/mock-operational-transport.ts)
- [src/app/api/internal/test-data/v1/snapshot/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/snapshot/route.ts)
- [src/app/api/internal/test-data/v1/assets/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/assets/route.ts)

Interpretacion recomendada:

- sirven para fixtures, documentacion de contratos o pruebas internas
- no deben usarse como evidencia de que la app sigue siendo mock-first

## Restricciones y notas de Next.js 16

- este repo usa App Router y route handlers modernos
- `cookies()` es async en los handlers donde aplica
- los handlers BFF son endpoints publicos y deben tratarse como superficie expuesta
- no conviene llamar route handlers desde Server Components cuando el dato puede obtenerse directo de la fuente server-side

## Documentos relacionados

- [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
- [feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
- [dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
- [qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)
- [contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
- [contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
