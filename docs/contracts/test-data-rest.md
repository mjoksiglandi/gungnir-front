# REST interno para insercion de datos de prueba

## Estado

Implementado parcialmente para desarrollo y QA.

No forma parte del contrato publico de lectura definido en [rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md).

## Objetivo

Permitir carga controlada de snapshot y entidades de prueba usando el modelo canonico actual, sin inventar DTOs paralelos y sin contaminar la API publica `v1`.

## Superficie real hoy

La documentacion historica de esta superficie era mas amplia que el codigo actual. Hoy solo existen dos endpoints mutantes:

- `PUT /api/internal/test-data/v1/snapshot`
- `POST /api/internal/test-data/v1/assets`

Referencia:

- [src/app/api/internal/test-data/v1/snapshot/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/snapshot/route.ts)
- [src/app/api/internal/test-data/v1/assets/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/assets/route.ts)
- [src/shared/data/operational-data.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts)

## Principios

- namespace separado del REST publico
- payloads iguales al shape canonico actual
- uso exclusivo en desarrollo, QA, demo o fixtures automatizados
- sin promover mutaciones publicas no aprobadas

## Habilitacion

Namespace:

- base path: `/api/internal/test-data/v1`

Reglas actuales:

- deshabilitado por defecto
- habilitado implicitamente en `NODE_ENV=test`
- para desarrollo manual exige `INTERNAL_TEST_DATA_WRITE_ENABLED=true`
- las mutaciones rechazan origen cruzado cuando el navegador envia `Origin` o `Referer`

## Recursos y operaciones

### Reemplazar snapshot completo

`PUT /api/internal/test-data/v1/snapshot`

Proposito:

- cargar un escenario entero de prueba
- reinicializar el store mock para una demo o suite

Body:

- `OperationalScenario`

Respuesta:

- `OperationalScenario`

Ejemplo:

```json
{
  "assets": [],
  "alerts": [],
  "incidents": [],
  "layers": [],
  "timeline": []
}
```

### Crear o actualizar asset

`POST /api/internal/test-data/v1/assets`

Body:

- `Asset`

Respuesta:

- `Asset`

## Payloads canonicos

Los payloads deben reutilizar exactamente estos shapes cuando corresponda:

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)
  - `Asset`
  - `OperationalScenario`

## Validaciones minimas

### Para snapshot completo

- `assets`, `alerts`, `incidents`, `layers` y `timeline` deben existir
- el body debe satisfacer `OperationalScenario`

### Para assets

- `kind` debe ser `asset`
- `id` debe existir y no venir vacio
- `updatedAt` debe venir en ISO datetime
- `version` debe ser entero positivo

## Errores esperados

Envelope actual:

```json
{
  "error": {
    "code": "invalid_body",
    "message": "Request body must satisfy the canonical Asset shape."
  }
}
```

Codigos presentes o esperados:

- `invalid_body`
- `not_available_in_environment`
- `forbidden_origin`

## Ejemplos de insercion

### Crear o actualizar asset

```http
POST /api/internal/test-data/v1/assets
Content-Type: application/json
Origin: http://localhost:3000
```

```json
{
  "id": "asset-demo-1",
  "kind": "asset",
  "version": 1,
  "updatedAt": "2026-05-13T18:30:00.000Z",
  "source": "qa-seed",
  "name": "Demo Asset 1",
  "callsign": "DMO-01",
  "assetType": "air",
  "status": "nominal",
  "affiliation": "friendly",
  "position": {
    "lat": -33.45,
    "lon": -70.65,
    "altM": 500,
    "headingDeg": 90,
    "speedMps": 12
  },
  "batteryPct": 78,
  "linkQualityPct": 91,
  "mission": "Smoke scan"
}
```

### Reemplazar snapshot de prueba

```http
PUT /api/internal/test-data/v1/snapshot
Content-Type: application/json
Origin: http://localhost:3000
```

Body:

- cualquier `OperationalScenario` valido

## Relacion con replay y WebSocket

Esta superficie sigue siendo util para:

- demos guiadas
- test manual de detalle, lista y mapa
- fixtures de pruebas internas

No debe interpretarse como la API operativa principal actual.

## Recomendaciones DevOps

- habilitar solo cuando exista necesidad operativa concreta
- mantener `INTERNAL_TEST_DATA_WRITE_ENABLED=false` por defecto
- exigir aislamiento de entorno y mismo origen del request
- registrar mutaciones para reproducibilidad
- no mezclar esta superficie con la API publica consumida por clientes finales
