# Estado de Features

Fecha de corte: `2026-06-01`

## Resumen

El repositorio ya no está en una fase puramente mock-first. La aplicación opera como frontend `Next.js 16` autenticado contra backend, con proxy BFF, runtime realtime y superficies operacionales funcionales en `/operations`, `/alerts`, `/incidents` y `/assets`.

Además, el workspace muestra una línea de integración geoespacial activa en curso: soporte dedicado para incendios y sismos, refresco periódico de overlays y mayor densidad visual dentro del mapa operacional.

## Features ya integradas

### Plataforma y acceso

- autenticación vía `POST /api/session/login`, `GET /api/session/me` y `POST /api/session/logout`
- proxy autenticado en `src/app/api/backend/[...path]/route.ts` con refresh token cuando el backend devuelve `401`
- protección server-side de rutas privadas con `requireAuthenticatedUser()`

### Superficie operacional

- runtime vivo en `/operations` con `OperationsRuntimeProvider`
- consumo de bootstrap COP desde `/api/v1/operations/bootstrap`
- sincronización realtime por `Socket.IO` para tracks, telemetría, alertas, comandos, misiones y capas
- selección de activo, seguimiento, comandos y sidebars operacionales
- panel de capas con presets, toggles, leyenda visible y comportamiento adaptado a móvil

### Entidades y vistas

- listado y detalle de `assets`
- listado y detalle de `alerts`
- listado y detalle de `incidents`
- lectura tipada del snapshot operacional y transformación DTO -> dominio

### Geoespacial

- geocercas operacionales
- capas de mapa servidas por backend (`map_layers` / `layer_features`)
- hazards naturales ya conectados en la experiencia:
  - incendios activos
  - sismos
  - weather hazards
  - overlay día/noche

### Operación y entrega

- empaquetado Docker
- workflow para publicación de imagen en `GHCR`
- documentación de contratos REST y WebSocket ya presente en `docs/contracts/`

## Features en integración ahora mismo

La evidencia más clara está en el árbol de trabajo y el staging local del `2026-06-01`.

### Overlays geoespaciales en mapa

- nuevo hook `src/widgets/map-stage/use-geospatial-overlays.ts`
- render de `earthquakes` y `wildfires` en `src/widgets/map-stage/map-stage-canvas.tsx`
- nuevos toggles de visibilidad en `LayerState`
- métricas visibles en el control dock para conteo de sismos USGS y hotspots FIRMS

### Nuevas fuentes geoespaciales

- endpoint `GET /api/geospatial/earthquakes`
- loader `src/shared/geospatial/earthquake-layer.ts` para feed USGS M2.5+ diario
- migración del loader de incendios hacia `src/shared/feeds/nasa-firms-hotspots.ts`
- caché HTTP explícita para `fire-hotspots` y `earthquakes`

## Siguientes pasos recomendados

1. Cerrar la integración visual de hazards con estados de `loading`, `stale` y `unavailable` en la UI, porque hoy el mapa prioriza renderizar datos pero no explica claramente la salud del feed.
2. Unificar la documentación: parte de `docs/project-reference.md` e `implementation-plan.md` todavía describe una etapa más centrada en mocks que el estado actual del producto.
3. Añadir smoke tests end-to-end para login y `/operations`, porque la suite nueva cubre contratos/helpers pero todavía no recorre el flujo completo del operador.
4. Consolidar la observabilidad de `NASA FIRMS`: exponer freshness, volumen y fallos del feed sin arrastrar fallbacks legacy ya retirados del código activo.
5. Definir freshness y observabilidad de overlays: timestamp visible, TTL efectivo y política cuando el feed externo falla.
6. Revisar si `bootstrap.geospatial` debe incluir `earthquakes` igual que `fireHotspots` para evitar doble fetch inicial en cliente.

## Mejoras de producto y código

- Mostrar estado de conexión realtime y estado de feeds externos como indicadores separados.
- Persistir preferencias de capas más allá de `searchParams`.
- Agregar contract tests para proxy autenticado y refresh de sesión.
- Incorporar una matriz de QA por superficie operativa: auth, mapa, alerts, incidents, assets y geospatial feeds.
- Evaluar cobertura adicional sobre `use-map-stage-ui` para presets y combinaciones de capas.
