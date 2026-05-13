# Referencia del Proyecto

## Resumen

`gugnir-console-front` es una consola operacional web basada en `Next.js 16` que hoy funciona sobre un modelo tipado y un transporte mock replayable. El objetivo del repositorio no es sólo renderizar pantallas, sino fijar contratos estables antes de introducir backend real.

## Objetivos técnicos actuales

- conservar un modelo canónico único para frontend y contratos
- exponer bootstrap y lectura REST sin transformar el shape actual
- preparar convergencia con un stream WebSocket incremental
- separar overlays geoespaciales externos del dominio operacional canónico

## Fuente de verdad

### Modelo canónico

Archivo:

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)

Entidades principales:

- `Asset`
- `Alert`
- `Incident`
- `GeoLayer`
- `TimelineEvent`
- `OperationalScenario`

### Bootstrap del mapa

Archivo:

- [src/shared/contracts/operations-map.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operations-map.ts)

Shape principal:

- `MapStageBootstrap`
  - `snapshot: OperationalScenario`
  - `geospatial: GeospatialBootstrap`
  - `hydratedAt: string`

## Arquitectura actual

### UI

- [src/app/operations/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/operations/page.tsx)
  entrada de la superficie operacional
- [src/widgets/map-stage.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage.tsx)
  frontera cliente para el mapa
- [src/widgets/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage-client.tsx)
  render operativo, capas, selección y sidebars

### Datos

- [src/shared/data/operational-data.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts)
  gateway server-side para snapshot, lectura por entidad y mutaciones mock
- [src/shared/data/operations-map-bootstrap.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operations-map-bootstrap.ts)
  composición de bootstrap REST-friendly

### Mock y replay

- [src/shared/mock/scenario.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario.ts)
  snapshot actual de demo
- [src/shared/mock/scenario-replay.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario-replay.ts)
  frames ordenados para replay y derivación del stream
- [src/shared/transport/mock-operational-transport.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport/mock-operational-transport.ts)
  transporte mutable con reset, step, speed y upserts

### Contratos de transporte

- [src/shared/transport/operational-events.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport/operational-events.ts)
  catálogo de eventos operacionales
- [src/shared/contracts/rest.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/rest.ts)
  convenciones mínimas de la API REST
- [src/shared/contracts/websocket.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/websocket.ts)
  tipos del stream WebSocket

## Rutas funcionales

### UI

- `/operations`
- `/assets`
- `/assets/:id`
- `/alerts`
- `/alerts/:id`
- `/incidents`
- `/incidents/:id`

### API pública

- `/api/v1/operations/bootstrap`
- `/api/v1/operations/snapshot`
- `/api/v1/assets`
- `/api/v1/assets/:id`
- `/api/v1/alerts`
- `/api/v1/alerts/:id`
- `/api/v1/incidents`
- `/api/v1/incidents/:id`
- `/api/v1/layers`
- `/api/v1/layers/:id`
- `/api/v1/timeline`
- `/api/v1/timeline/:id`
- `/api/v1/geospatial/fire-hotspots`

## Flujo de datos actual

1. La ruta `/operations` solicita `getOperationsMapBootstrap()`.
2. El bootstrap compone snapshot canónico más overlay geoespacial.
3. `MapStageClient` consume el bootstrap como estado inicial.
4. El replay mock y los contratos WebSocket definen cómo evolucionará ese estado en tiempo real.

## Restricciones arquitectónicas

- No introducir entidades nuevas fuera del backlog aprobado.
- No mezclar `FireHotspot` con `OperationalScenario`.
- No romper el shape actual del frontend al diseñar contratos.
- No asumir que Next App Router es host suficiente para WebSockets largos.

## Documentos relacionados

- [implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md)
- [contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
- [contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
- [contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md)
