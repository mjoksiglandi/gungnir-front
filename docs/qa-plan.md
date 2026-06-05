# Plan de QA

Fecha de corte: `2026-06-04`

## Objetivo

Definir una base de validacion realista para el estado actual del producto: pruebas automatizadas que ya existen, chequeos manuales de alto valor y el siguiente tramo de cobertura recomendado.

## Baseline actual

Validaciones ejecutadas en este corte:

- `corepack pnpm lint`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm audit --prod`

Resultado:

- sin errores de lint
- `26` tests pasando
- build de produccion exitoso
- sin vulnerabilidades conocidas en dependencias de produccion

## Cobertura automatizada vigente

La suite con `Vitest` cubre hoy:

- utilidades HTTP en `src/app/api/v1/_lib/http.ts`
- helpers del mapa y de la refactorizacion activa
- loaders geoespaciales
- contratos de cache para endpoints geoespaciales

Cobertura especialmente valiosa:

- `tests/http-utils.test.ts`
- `tests/geospatial-routes.test.ts`
- `tests/earthquake-layer.test.ts`
- `tests/map-stage-helpers.test.ts`
- `tests/map-stage-client-helpers.test.ts`
- `tests/map-stage-refactor-helpers.test.ts`

## Matriz manual recomendada

### Auth y sesion

- login valido crea sesion y redirige al flujo operativo
- login invalido muestra error controlado
- sesion expirada intenta refresh y, si falla, limpia estado local
- logout elimina cookies de sesion y deja al usuario fuera de rutas privadas
- requests cross-origin a login/logout deben responder `403` cuando incluyen `Origin` o `Referer` externos

### Proxy BFF

- `/api/backend/*` reenvia headers necesarios
- respuestas `401` disparan refresh cuando existe `refreshToken`
- si el refresh falla, las cookies se limpian

### Operations

- `/operations` carga sin errores con backend disponible
- seleccion de activo abre sidebar correcta
- toggles de capas actualizan render y paneles
- query params `lat`, `lon`, `zoom` y `layers` hidratan el estado esperado
- acciones rapidas sobre activo no rompen focus ni seleccion

### Geoespacial

- `earthquakes` renderiza marcadores y popup coherente
- `fire-hotspots` renderiza hotspots sin duplicacion visual
- feed externo caido no rompe el stage completo
- refresco periodico no reinicia seleccion ni overlays locales

### Entidades

- `/assets` y `/assets/[id]` cargan sin dependencia de fixtures locales
- `/alerts` y `/alerts/[id]` reflejan estado actual del backend
- `/incidents` y `/incidents/[id]` mantienen consistencia entre listas y detalle

### Test-data interno

- `api/internal/test-data/*` rechaza escrituras por defecto
- `api/internal/test-data/*` solo acepta escrituras con `INTERNAL_TEST_DATA_WRITE_ENABLED=true` o `NODE_ENV=test`
- payload invalido responde `400`

## Gaps principales

- no hay pruebas E2E de navegador
- no hay tests de route handlers para `api/session/*` y `api/backend/*`
- no hay validacion automatizada de reconnect realtime extremo a extremo
- no hay smoke tests sobre la refactorizacion activa de `map-stage` en navegador real

## Siguiente expansion recomendada

1. Agregar tests de route handlers para auth, same-origin y feature flags internas.
2. Introducir `Playwright` para login y un recorrido minimo por `/operations`.
3. Cubrir el proxy BFF con escenarios de `401 -> refresh -> retry`.
4. Anadir una smoke suite visual ligera para la UI de `map-stage` cuando cierre la refactorizacion actual.
