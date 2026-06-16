# Referencia del proyecto

## Resumen

`gugnir-console-front` es una app `Next.js 16` con App Router que funciona como frontend operacional y BFF autenticado para el backend de Gugnir. La experiencia central vive en `/operations`, mientras el resto de rutas privadas reutiliza el mismo shell y las mismas fuentes de datos.

## Arquitectura de alto nivel

### Capas principales

- `src/app`: routing, layouts, metadata y route handlers.
- `src/components`: UI transversal compartida.
- `src/features`: implementacion por modulo funcional.
- `src/lib`: acceso tecnico al backend, auth, websocket y helpers de navegacion.
- `src/services`: fachadas de lectura para la app.
- `src/types`: DTOs y modelos de dominio.
- `src/shared`: contratos y modulos heredados aun usados por runtime o testing.
- `src/widgets`: bridges de compatibilidad desde la estructura anterior.

### Surface split

- UI privada: `src/app/(console)/*`
- UI publica/minima: `src/app/login`, `src/app/backend-unavailable`, `/`
- BFF: `src/app/api/session/*` y `src/app/api/backend/[...path]`
- API de lectura interna: `src/app/api/v1/*`
- geoespacial: `src/app/api/geospatial/*` y `src/app/api/v1/geospatial/*`

## Rutas UI actuales

### Publicas

- `/`
- `/login`
- `/backend-unavailable`

### Privadas bajo `app/(console)`

- `/operations`
- `/alerts`
- `/alerts/[id]`
- `/assets`
- `/assets/[id]`
- `/incidents`
- `/incidents/[id]`
- `/historicos`

El layout compartido de rutas privadas vive en [src/app/(console)/layout.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/layout.tsx) y monta [src/components/layout/console-shell.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/components/layout/console-shell.tsx).

## Modulos del repo

### `features/auth`

Responsabilidad:

- formulario de login cliente
- interaccion con `POST /api/session/login`
- navegacion post-login

Archivo principal:

- [src/features/auth/components/login-form.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/auth/components/login-form.tsx)

### `features/alerts`

Responsabilidad:

- render del workspace de alertas
- refresh en cliente por websocket
- acciones sobre alertas

Archivo principal:

- [src/features/alerts/components/alerts-workspace.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/alerts/components/alerts-workspace.tsx)

### `features/history`

Responsabilidad:

- experiencia de historicos
- construccion de records derivados desde assets/devices/tracks
- filtros y vista mapa/timeline

Archivos principales:

- [src/features/history/components/history-workspace.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-workspace.tsx)
- [src/features/history/components/history-map.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-map.tsx)
- [src/features/history/utils/history-helpers.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/utils/history-helpers.ts)

### `features/operations`

Responsabilidad:

- runtime principal del mapa
- orquestacion de bootstrap, snapshot y overlays
- seleccion/focus/follow de activos
- panel de capas, sidebars y acciones operacionales

Entradas principales:

- [src/features/operations/components/map-stage.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage.tsx)
- [src/features/operations/components/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage-client.tsx)
- [src/features/operations/components/map-stage/operations-runtime-provider.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage/operations-runtime-provider.tsx)

Submodulos notorios dentro de `map-stage/`:

- `map-stage-canvas*`: render y popups del mapa
- `map-stage-layer-panel*`: rail y detalle de capas
- `map-stage-asset-sidebar*`: detalle operativo del activo seleccionado
- `map-stage-device-sidebar.tsx`: lista y navegacion de dispositivos
- `use-*`: hooks especializados por concern

## Tipos y contratos

### DTOs y dominio

- [src/types/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/api.ts)
- [src/types/domain.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/types/domain.ts)

### Contratos compartidos

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)
- [src/shared/contracts/operations-map.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operations-map.ts)
- [src/shared/contracts/rest.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/rest.ts)
- [src/shared/contracts/websocket.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/websocket.ts)

## Acceso al backend

### Auth y sesion

- [src/lib/auth.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/auth.ts)
- [src/lib/auth-session.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/auth-session.ts)
- [src/lib/api.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api.ts)
- [src/lib/api-server.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/api-server.ts)

### Route handlers principales

- `api/session/login`
- `api/session/me`
- `api/session/logout`
- `api/backend/[...path]`
- `api/v1/operations/bootstrap`
- `api/v1/operations/snapshot`
- `api/v1/assets`
- `api/v1/alerts`
- `api/v1/incidents`
- `api/v1/layers`
- `api/v1/timeline`

## Geoespacial

Fuentes actuales:

- incendios: [src/shared/feeds/nasa-firms-hotspots.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/feeds/nasa-firms-hotspots.ts)
- earthquakes: [src/shared/geospatial/earthquake-layer.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/geospatial/earthquake-layer.ts)
- fire hotspots: [src/shared/geospatial/fire-hotspot-layer.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/geospatial/fire-hotspot-layer.ts)

Politica actual:

- los hazards externos viven fuera del escenario operacional canonico
- el cliente mezcla capas del backend y hazards externos al renderizar

## Legacy y compatibilidad

### `src/shared`

Sigue conteniendo codigo util y contratos legitimos, pero no todo representa la direccion de estructura futura. Aun aloja:

- contratos
- loaders geoespaciales
- mocks/replay
- gateway de datos base

### `src/widgets`

Hoy funciona como capa de compatibilidad. Los archivos que quedan ahi reexportan modulos movidos a `src/features/operations/components/map-stage/*` para no romper tests o imports heredados.

### `src/app/historicos/history-helpers.ts`

Tambien es un bridge temporal hacia `src/features/history/utils/history-helpers.ts`.

## Regla practica para codigo nuevo

1. Rutas, metadata y handlers en `src/app`.
2. UI reutilizable transversal en `src/components`.
3. UI y logica especifica de un dominio en `src/features/<feature>`.
4. Acceso tecnico a backend/auth/ws en `src/lib`.
5. Fachadas de lectura/orquestacion reusable en `src/services`.
6. Evitar agregar codigo nuevo en `src/widgets` salvo bridges.

## Documentos relacionados

- [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
- [scaffolding.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/scaffolding.md)
- [feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
- [dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
