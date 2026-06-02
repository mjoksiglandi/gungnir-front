# Dependencias y Servicios Utilizados

## Resumen

Este documento registra las dependencias técnicas y servicios externos que hoy forman parte del proyecto, junto con su rol dentro de la arquitectura.

## Dependencias de runtime

### `next@16.2.6`

- framework principal
- App Router
- Route Handlers para la API REST pública actual
- build con Turbopack

Uso principal:

- páginas bajo `src/app`
- endpoints bajo `src/app/api`

### `react@19.2.4`

- modelo de componentes
- estado y rendering del frontend

### `react-dom@19.2.4`

- runtime DOM para React

### `leaflet@1.9.4`

- mapa interactivo
- markers, polygons, polylines y tooltips

### `react-leaflet@5.0.0`

- bindings React para Leaflet
- integración del mapa con el árbol de componentes

## Dependencias de desarrollo

### `typescript`

- tipado del modelo canónico
- contratos compartidos REST y WebSocket

### `eslint@^9`

- validación estática del código

### `eslint-config-next@16.2.6`

- reglas adaptadas a Next.js 16

### `@types/node`

- tipos del runtime Node

### `@types/react`

- tipos de React 19

### `@types/react-dom`

- tipos de React DOM

### `@types/leaflet`

- tipos del mapa y primitivas de Leaflet

## Servicios externos

### NASA FIRMS

Uso:

- consumo de hotspots globales de incendios activos

Código:

- [src/shared/feeds/nasa-firms-hotspots.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/feeds/nasa-firms-hotspots.ts)

Rol:

- proveer overlay geoespacial externo
- no forma parte del dominio canónico

Endpoint consumido:

- `https://services9.arcgis.com/.../MODIS_Thermal_v1/FeatureServer/0/query`

## Dependencias implícitas del proyecto

### Modelo canónico

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)

Rol:

- dependencia lógica principal de todo el sistema
- define entidades, enums y shape del snapshot

### Transporte mock replayable

- [src/shared/transport/mock-operational-transport.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport/mock-operational-transport.ts)
- [src/shared/mock/scenario-replay.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock/scenario-replay.ts)

Rol:

- derivar comportamiento incremental
- fijar catálogo de eventos para el contrato WebSocket
- conservar fixtures y contratos de replay, no el runtime principal actual

## Dependencias operacionales recomendadas a futuro

Estas no están implementadas hoy, pero el estado del proyecto ya las sugiere:

- runtime WS-capable fuera de `route.ts` para stream largo
- tests de contrato para REST y WebSocket
- pipeline CI con `lint` y `build` como gates mínimos

## Comandos de validación actuales

```bash
corepack pnpm lint
corepack pnpm build
```
