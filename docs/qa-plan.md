# Plan de QA

Fecha de corte: `2026-06-01`

## Objetivo

Dejar una base de QA que permita validar la aplicación sin depender sólo de inspección manual. Este plan combina pruebas automatizadas de contratos y utilidades con un checklist manual para flujos críticos del operador.

## Cobertura automatizada incorporada

La suite inicial usa `Vitest` y cubre:

- utilidades HTTP de `src/app/api/v1/_lib/http.ts`
- helpers del mapa en `src/widgets/map-stage/helpers.ts`
- loader `src/shared/geospatial/earthquake-layer.ts`
- headers de caché en rutas `src/app/api/geospatial/*`

Comando:

```bash
corepack pnpm test
```

## Cobertura manual recomendada

### Auth y sesión

- login válido redirige a superficie operativa
- credenciales inválidas muestran error manejado
- sesión expirada fuerza refresh o logout limpio

### Operations

- `/operations` carga bootstrap sin flicker crítico
- selección de asset abre sidebar correcta
- envío de comando muestra feedback esperado
- toggles de capas cambian el render del mapa
- query params `lat`, `lon`, `zoom` y `layers` hidratan el estado correcto

### Hazards geoespaciales

- `earthquakes` renderiza marcadores y popup con magnitud, profundidad y hora
- `wildfires` renderiza hotspots con brightness, FRP y confidence
- falla de feed no rompe el stage completo
- refresco periódico no duplica overlays ni reinicia selección

### Alerts e incidents

- ACK y resolve actualizan el estado visible
- cambios realtime refrescan tarjetas sin hard refresh
- relación asset/alert/incident sigue consistente en sidebars y vistas detalle

### Assets

- rutas `/assets` y `/assets/[id]` cargan sin depender de mocks locales
- métricas visibles del activo coinciden con track y telemetría disponible

## Gaps pendientes

- no hay todavía pruebas E2E de navegador
- no hay mocks dedicados para `next/headers` y proxy auth flow
- no hay validación automática del runtime `Socket.IO` extremo a extremo

## Próxima expansión sugerida

1. Añadir `Playwright` para login, `/operations` y acciones básicas de alerts.
2. Mockear `next/headers` para probar `api/session/*` y `api/backend/*`.
3. Cubrir `use-map-stage-ui` con casos de presets, filtros y follow mode.
