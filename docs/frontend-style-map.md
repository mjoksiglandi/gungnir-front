# Frontend Style Map

Mapa rapido de ownership visual del front y criterio actual para mantener estilos centralizados en hojas de estilo.

## Regla base

- `src/app/globals.css`: solo estilos globales, tokens base y estados compartidos entre rutas.
- `*.module.css`: estilos encapsulados por pantalla, layout o feature.
- JSX/TSX: estructura, estado e interaccion. Evitar meter decisiones visuales directas salvo cuando una libreria de mapas exige estilos calculados en runtime.

Esta guia sigue la recomendacion actual de Next en `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`: usar CSS global solo para lo verdaderamente global y `CSS Modules` para estilo localizado.

## Mapa de hojas de estilo

- [src/app/globals.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/globals.css): tokens globales (`--background`, `--foreground`, etc.), reset base, tipografia global y estados de sistema como `not-found` y `global-error`.
- [src/components/layout/console-shell.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/components/layout/console-shell.module.css): shell principal de consola, header, navegacion, status bar y framing comun de las vistas autenticadas.
- [src/app/login/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/login/page.module.css): pantalla de acceso y formulario de login.
- [src/app/(console)/operations/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/operations/page.module.css): contenedor de la pantalla de operaciones.
- [src/features/operations/components/map-stage.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage.module.css): casi todo el lenguaje visual de operaciones. Controla canvas 2D, tooltips, popups, docks, sidebars, panel de capas, tarjetas de telemetria e instrumentacion responsive.
- [src/app/(console)/assets/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/assets/page.module.css): listado de assets/dispositivos.
- [src/app/entity-detail.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/entity-detail.module.css): layout compartido de vistas detalle para assets, incidents y alerts.
- [src/app/(console)/incidents/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/incidents/page.module.css): listado principal de incidentes/misiones.
- [src/app/(console)/alerts/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/alerts/page.module.css): workspace de alertas.
- [src/features/history/components/history-workspace.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-workspace.module.css): workspace historico, filtros, resultados, mapa y panel de detalle.
- [src/app/(console)/historicos/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/historicos/page.module.css): framing propio de la ruta de historicos.

## Mapa de ownership por vista

- `layout global`: [src/app/layout.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/layout.tsx) + [src/app/globals.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/globals.css)
- `shell autenticado`: [src/components/layout/console-shell.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/components/layout/console-shell.tsx) + [src/components/layout/console-shell.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/components/layout/console-shell.module.css)
- `login`: [src/app/login/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/login/page.tsx), [src/features/auth/components/login-form.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/auth/components/login-form.tsx) + [src/app/login/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/login/page.module.css)
- `operations`: [src/app/(console)/operations/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/operations/page.tsx) + [src/app/(console)/operations/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/operations/page.module.css)
- `map stage / canvas / sidebars / layers`: [src/features/operations/components/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage-client.tsx) y subcomponentes de `map-stage/` + [src/features/operations/components/map-stage.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage.module.css)
- `assets list`: [src/app/(console)/assets/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/assets/page.tsx) + [src/app/(console)/assets/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/assets/page.module.css)
- `entity detail pages`: [src/app/(console)/assets/[id]/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/assets/[id]/page.tsx), [src/app/(console)/incidents/[id]/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/incidents/[id]/page.tsx), [src/app/(console)/alerts/[id]/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/alerts/[id]/page.tsx) + [src/app/entity-detail.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/entity-detail.module.css)
- `incidents list`: [src/app/(console)/incidents/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/incidents/page.tsx) + [src/app/(console)/incidents/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/incidents/page.module.css)
- `alerts workspace`: [src/app/(console)/alerts/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/alerts/page.tsx), [src/features/alerts/components/alerts-workspace.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/alerts/components/alerts-workspace.tsx) + [src/app/(console)/alerts/page.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/alerts/page.module.css)
- `historicos`: [src/app/(console)/historicos/page.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/historicos/page.tsx), [src/features/history/components/history-workspace.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-workspace.tsx), [src/features/history/components/history-map.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-map.tsx) + [src/features/history/components/history-workspace.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/history/components/history-workspace.module.css)

## Excepciones tecnicas que hoy siguen en runtime

Estas partes no conviene forzarlas a CSS puro porque el estilo depende de datos geoespaciales o de APIs de Leaflet:

- [src/features/operations/components/map-stage/map-stage-canvas.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage/map-stage-canvas.tsx): `pathOptions`, `radius`, opacidades y colores para `Polygon`, `Polyline`, `Circle` y `CircleMarker`.
- [src/features/operations/components/map-stage/map-stage-canvas-popups.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage/map-stage-canvas-popups.tsx): usa `--layer-color` como variable CSS inyectada desde datos para que los popups reflejen el color del feed activo.
- [src/features/operations/components/map-stage/map-stage-layer-panel.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage/map-stage-layer-panel.tsx): usa `--layer-color` en swatches y metricas porque los layers visibles pueden venir de distintas fuentes y colores configurables.

## Limpieza ya aplicada

- El estado visual del punto de salud del dispositivo en [src/features/operations/components/map-stage/map-stage-device-sidebar.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage/map-stage-device-sidebar.tsx) ya no usa `style` inline.
- Ese color ahora se resuelve con clases de [src/features/operations/components/map-stage.module.css](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage.module.css): `.deviceDotNominal`, `.deviceDotDegraded` y `.deviceDotLost`.

## Criterio para cambios nuevos

- Si el valor visual es estable o discreto, moverlo a `*.module.css`.
- Si el valor viene de datos variables del mapa, usar CSS custom properties como puente minimo o dejarlo en `pathOptions` cuando Leaflet lo exija.
- Evitar agregar estilos globales nuevos salvo tokens, reset o estados compartidos reales.
