# Documentacion del proyecto

Indice de lectura para onboarding, mantenimiento y cambios de arquitectura.

## Orden sugerido

1. [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
2. [feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
3. [project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
4. [dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
5. [qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)
6. [security-review.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/security-review.md)
7. [refactor-roadmap.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/refactor-roadmap.md)
8. [contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
9. [contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
10. [contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md)
11. [implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md)
12. [handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md)

## Como leer este set

- `README.md`: entrada rapida, setup local y estado operativo actual.
- `feature-status.md`: fotografia del producto y de las integraciones activas.
- `project-reference.md`: mapa del repo, runtime y modulos clave.
- `dependencies.md`: librerias, servicios externos y deuda legacy que sigue presente.
- `qa-plan.md`: validacion manual y automatizada.
- `security-review.md`: hallazgos, mitigaciones aplicadas y riesgos residuales.
- `refactor-roadmap.md`: secuencia recomendada para seguir reduciendo complejidad.

## Contratos

- [contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md): superficie REST publica de lectura.
- [contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md): contrato incremental y restricciones del stream.
- [contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md): superficie interna para fixtures y pruebas; no tratar como API publica.

## Documentos historicos o de planeacion

- [implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md): decision log historico y restricciones arquitectonicas que siguen vigentes.
- [handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md): contexto historico de handoffs y gaps del stream realtime.
- [stages/08-websocket-handoff.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/stages/08-websocket-handoff.md): cierre puntual de la etapa websocket.

## Nota editorial

Parte del material de `mock/replay` sigue documentado porque todavia sirve como referencia de contrato y fixtures. Eso no significa que sea el runtime principal actual de la app.
