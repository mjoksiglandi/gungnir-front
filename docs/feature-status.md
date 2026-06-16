# Estado de features

Fecha de corte: `2026-06-16`

## Resumen

`gugnir-console-front` opera como frontend `Next.js 16` conectado a backend real, con autenticacion por cookies `httpOnly`, proxy BFF, route group autenticado en `app/(console)`, runtime operacional en `/operations` y vistas de soporte para `assets`, `alerts`, `incidents` y `historicos`.

El repo sigue en movimiento en el area `features/operations`, pero ya no corresponde describirlo como una app mock-first. El material mock y replay que sigue presente debe leerse como soporte contractual, fixtures o legado controlado.

## Capacidades vigentes

### Plataforma y acceso

- login, sesion actual y logout via `api/session/*`
- proteccion server-side de rutas privadas
- layout compartido para la zona autenticada
- proxy autenticado en `api/backend/[...path]`
- refresh token resuelto del lado servidor

### Superficie operacional

- workspace principal en `/operations`
- bootstrap inicial desde `/api/v1/operations/bootstrap`
- snapshot operacional desde `/api/v1/operations/snapshot`
- sidebars de activos y dispositivos
- seleccion, focus, follow y acciones rapidas sobre activos
- panel de capas y control dock operacional
- edicion y composicion modular del runtime movida a `src/features/operations`

### Entidades y navegacion

- listado y detalle de `assets`
- listado y detalle de `alerts`
- listado y detalle de `incidents`
- vista de `historicos` con filtros y replay de rutas
- transformacion tipada DTO -> dominio para REST y runtime del mapa

### Geoespacial

- capas operacionales servidas por backend
- hazards externos integrados en la experiencia:
  - incendios activos
  - sismos
  - weather hazards
  - overlay dia/noche

### Calidad y entrega

- `eslint`, `vitest` y `next build` funcionando
- imagen Docker para despliegue
- workflow de publicacion a `GHCR`
- documentacion de contratos REST y WebSocket

## Areas activas de cambio

### Refactor de `operations`

La zona con mas movimiento actual es `src/features/operations/components/map-stage/*`.

Estado observado:

- extraccion de helpers y hooks especializados
- separacion entre canvas, sidebars, overlays y runtime sync
- pruebas nuevas enfocadas en helpers de la refactorizacion

Esto ya merece tratarse como una refactorizacion en curso, no como una feature experimental aislada.

### Observabilidad geoespacial

La integracion de hazards ya existe, pero todavia hay espacio para mejorar:

- estados `loading`, `stale` y `unavailable`
- timestamps de freshness visibles
- politicas de fallback cuando falla un feed externo

## Riesgos y deuda vigente

- el runtime WebSocket documentado sigue siendo mas fuerte como contrato que como evidencia de implementacion completa end-to-end
- `operationalDataGateway` conserva mutaciones stub y mezcla responsabilidades de lectura real con legado de fixtures
- la documentacion historica todavia podia sugerir mas superficie interna mutable de la que el codigo implementa
- faltan pruebas E2E de navegador para los flujos mas sensibles

## Prioridades recomendadas

1. Reducir los bridges de compatibilidad en `src/widgets` y `src/app/historicos`.
2. Agregar pruebas de route handlers para auth, same-origin y `internal/test-data`.
3. Incorporar smoke tests E2E para login y `/operations`.
4. Seguir migrando documentacion e imports remanentes hacia el scaffold nuevo.

## Documentos relacionados

- [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
- [scaffolding.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/scaffolding.md)
- [project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
- [qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)
- [security-review.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/security-review.md)
- [refactor-roadmap.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/refactor-roadmap.md)
