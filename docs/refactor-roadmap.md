# Roadmap de refactor

Fecha de corte: `2026-06-04`

## Objetivo

Reducir complejidad accidental sin interrumpir la refactorizacion activa del workspace `map-stage`.

## Prioridades

### 1. Consolidar el borde BFF

Motivo:

- la logica de request/autenticacion vive repartida entre `src/lib/api.ts`, `src/lib/api-server.ts` y `src/app/api/backend/[...path]/route.ts`

Oportunidades:

- extraer politicas compartidas de error handling
- centralizar copy de headers permitidos
- documentar que rutas consumen backend directo server-side y cuales pasan por proxy browser-side

### 2. Cerrar el contrato de `operationalDataGateway`

Motivo:

- [src/shared/data/operational-data.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts) mantiene mutaciones stub que hoy no representan el runtime real

Oportunidades:

- separar interfaz de lectura del legado mutable
- mover capacidades de fixture a un adapter de test-data aislado
- evitar que la documentacion sugiera write paths inexistentes

### 3. Terminar la modularizacion de `map-stage`

Motivo:

- el repo ya trae una refactorizacion local en curso bajo `src/widgets/map-stage/*`
- hay nuevos helpers, hooks y paneles aun no integrados del todo en la documentacion

Oportunidades:

- definir ownership por modulo: canvas, overlays, sidebars, drawing, focus y runtime sync
- fijar boundaries entre state derivado de URL, state de UI y state realtime
- cubrir hooks nuevos con pruebas unitarias selectivas antes de seguir extrayendo componentes

### 4. Alinear contratos y docs con el codigo real

Motivo:

- `docs/contracts/test-data-rest.md` describia una superficie mas amplia que la implementada

Oportunidades:

- documentar solo endpoints reales
- marcar propuestas futuras como propuestas, no como contrato vigente
- mantener una tabla de "implementado vs planificado"

## Secuencia recomendada

1. Congelar y fusionar la refactorizacion actual de `map-stage`.
2. Extraer helpers compartidos del BFF con pruebas de route handlers.
3. Separar `operationalDataGateway` en lectura real y fixtures.
4. Limpiar documentacion residual de mocks una vez cerrada la integracion.
