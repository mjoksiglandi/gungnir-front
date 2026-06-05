# Plan de implementacion

Fecha de corte: `2026-06-04`

## Estado

Documento historico reencuadrado.

Ya no debe interpretarse como el plan maestro del repo, sino como un registro de decisiones que siguen influyendo en la arquitectura actual.

## Que sigue vigente

### 1. El modelo canonico compartido

Sigue vigente que el dominio operacional base se apoya en:

- `Asset`
- `Alert`
- `Incident`
- `GeoLayer`
- `TimelineEvent`
- `OperationalScenario`

Fuente principal:

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)

### 2. Los contratos derivan del modelo, no al reves

Sigue siendo una buena decision que REST y WebSocket se documenten a partir del modelo compartido, en lugar de ir incorporando shapes paralelos por feature.

### 3. Las restricciones de Next.js 16

Tambien sigue vigente:

- App Router como base
- boundaries server/client explicitos
- `cookies()` y demas request-time APIs tratadas como async
- cuidado con cualquier supuesto heredado de versiones anteriores

## Que ya quedo atras

Estas ideas ya no deben leerse en tiempo presente:

- que la app sea principalmente mock-backed
- que `src/shared/mock/scenario.ts` sea la fuente de verdad operativa del producto
- que la siguiente fase natural sea apenas "agregar bootstrap y transport"

Hoy el producto ya consume backend real para sus superficies principales.

## Uso recomendado de este documento

Leerlo como decision log resumido para:

- recordar por que existe el modelo compartido
- mantener disciplina en contratos
- evitar suposiciones incorrectas sobre Next.js 16

Para el estado actual del producto, usar primero:

1. [README.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/README.md)
2. [feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
3. [project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
4. [refactor-roadmap.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/refactor-roadmap.md)

## Proxima consolidacion sugerida

Cuando cierre la refactorizacion de `map-stage`, conviene extraer de aqui solo dos cosas hacia documentacion mas permanente:

- principios del modelo compartido
- restricciones operativas de Next.js 16

El resto puede quedar como historico o archivarse.
