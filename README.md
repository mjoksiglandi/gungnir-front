# Gugnir Console Front

Frontend de consola operacional para una plataforma estilo C4. El repositorio parte desde la experiencia web, un modelo tipado congelado y un transporte mock replayable, antes de integrar backend real y telemetria en vivo.

## Estado actual

- `Next.js 16` con App Router
- shell operacional en `/operations`
- vistas dedicadas para `assets`, `alerts` e `incidents`
- modelo canónico en `src/shared/contracts/operational.ts`
- snapshot mock y replay mock para derivar contratos
- contrato REST público `v1` ya documentado
- contrato WebSocket listo para implementación iterativa

## Documentación

La entrada recomendada para navegar la documentación del proyecto es [docs/index.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/index.md).

Referencias rápidas:

- visión del repo: [docs/project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
- dependencias y servicios usados: [docs/dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
- contrato REST público: [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
- contrato WebSocket: [docs/contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
- esquema REST interno para datos de prueba: [docs/contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md)
- plan de implementación y decisiones del modelo: [docs/implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md)
- handoff de Stage 8: [docs/handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md)

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La ruta raíz redirige a `/operations`.

Comandos útiles:

```bash
npm run lint
npm run build
```

## Estructura principal

- `src/app`
  superficie App Router, páginas y Route Handlers
- `src/shared/contracts`
  contratos de dominio, REST y WebSocket
- `src/shared/data`
  gateway server-side para snapshot, entidades y bootstrap
- `src/shared/mock`
  snapshot base y frames de replay
- `src/shared/transport`
  transporte mock replayable y catálogo de eventos operacionales
- `src/shared/geospatial`
  contratos de feed geoespacial
- `src/shared/feeds`
  integración con ArcGIS/NASA hotspots
- `src/widgets`
  shell de UI y mapa operacional
- `docs`
  documentación enlazable del proyecto

## Contratos vigentes

### API pública de lectura

- `GET /api/v1/operations/bootstrap`
- `GET /api/v1/operations/snapshot`
- `GET /api/v1/assets`
- `GET /api/v1/assets/:id`
- `GET /api/v1/alerts`
- `GET /api/v1/alerts/:id`
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/:id`
- `GET /api/v1/layers`
- `GET /api/v1/layers/:id`
- `GET /api/v1/timeline`
- `GET /api/v1/timeline/:id`
- `GET /api/v1/geospatial/fire-hotspots`

### API interna propuesta para datos de prueba

El esquema para sembrar snapshot y entidades de prueba está documentado en [docs/contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md). No forma parte del contrato público `v1` actual.

## Dependencias principales

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `typescript`
- `eslint` + `eslint-config-next`

Servicios externos actuales:

- ArcGIS FeatureServer para hotspots MODIS/NASA

## Criterios arquitectónicos importantes

- el modelo fuente de verdad es el shape actual de `OperationalScenario`
- REST se deriva del modelo actual, no de deseos futuros
- WebSocket se deriva del replay mock y debe converger con REST bootstrap
- `FireHotspot` sigue siendo overlay externo, no entidad canónica
- para Next 16, los `Route Handlers` no deben asumirse como host fiable para WebSockets largos

## Próximos pasos recomendados

1. Implementar el adapter real del stream WebSocket fuera del `route.ts` normal.
2. Definir watermark o `lastSequence` para bootstrap + resume seguro.
3. Materializar la API interna de test-data si el equipo necesita fixtures remotos.
4. Agregar tests automáticos de convergencia REST + WebSocket + replay.
