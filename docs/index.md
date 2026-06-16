# Documentacion del proyecto

Indice de lectura para onboarding, mantenimiento y evolucion del repo despues del refactor estructural.

## Lectura rapida

1. [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
2. [scaffolding.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/scaffolding.md)
3. [project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
4. [feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
5. [frontend-style-map.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/frontend-style-map.md)

## Que explica cada documento

- `README.md`: setup, stack, comandos y mapa rapido del repo.
- `scaffolding.md`: estructura de carpetas actual, ownership por modulo y reglas de colocacion.
- `project-reference.md`: arquitectura operativa, rutas, BFF, contratos y runtime principal.
- `feature-status.md`: fotografia funcional actual y deuda visible.
- `frontend-style-map.md`: ownership visual del front, criterio de estilos y excepciones runtime del mapa.
- `dependencies.md`: librerias, servicios externos y dependencias de plataforma.
- `qa-plan.md`: cobertura actual y estrategia de validacion.
- `security-review.md`: hallazgos y mitigaciones.
- `refactor-roadmap.md`: trabajo pendiente para seguir cerrando deuda estructural.

## Contratos

- [contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
- [contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
- [contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md)

## Documentacion historica

- [implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md)
- [handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md)
- [stages/08-websocket-handoff.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/stages/08-websocket-handoff.md)

## Nota editorial

`src/shared` y `src/widgets` siguen apareciendo en varios documentos porque todavia existen como capa de compatibilidad y como base de contratos. La estructura objetivo para codigo nuevo es la que se describe en `README.md` y `scaffolding.md`.
