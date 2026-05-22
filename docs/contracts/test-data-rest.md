# REST Interno Para Inserción de Datos de Prueba

## Estado

Propuesto para implementación interna de desarrollo y QA.

No forma parte del contrato público de lectura definido en [rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md).

## Objetivo

Permitir carga controlada de snapshot y entidades de prueba usando el modelo canónico actual, sin inventar DTOs paralelos y sin contaminar la API pública `v1`.

## Alcance

Este esquema se deriva de las capacidades ya expuestas por el gateway:

- `replaceSnapshot`
- `upsertAsset`
- `upsertAlert`
- `upsertIncident`
- `upsertLayer`
- `appendTimelineEvent`

Referencia:

- [src/shared/data/operational-data.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts)

## Principios

- namespace separado del REST público
- payloads iguales al shape canónico actual
- uso exclusivo en desarrollo, QA, demo o fixtures automatizados
- sin promover mutaciones públicas no aprobadas

## Namespace recomendado

- base path: `/api/internal/test-data/v1`

Alternativas válidas:

- `/api/dev/test-data/v1`
- `/api/admin/test-data/v1`

Recomendación:

- usar `/api/internal/test-data/v1`
- proteger por entorno o feature flag
- deshabilitar en producción si no existe un caso explícito

## Recursos y operaciones

### Reemplazar snapshot completo

`PUT /api/internal/test-data/v1/snapshot`

Propósito:

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

### Upsert de asset

`PUT /api/internal/test-data/v1/assets/:id`

Body:

- `Asset`

Regla:

- `:id` debe coincidir con `body.id`

Respuesta:

- `Asset`

### Upsert de alert

`PUT /api/internal/test-data/v1/alerts/:id`

Body:

- `Alert`

Regla:

- `:id` debe coincidir con `body.id`

Respuesta:

- `Alert`

### Upsert de incident

`PUT /api/internal/test-data/v1/incidents/:id`

Body:

- `Incident`

Regla:

- `:id` debe coincidir con `body.id`

Respuesta:

- `Incident`

### Upsert de layer

`PUT /api/internal/test-data/v1/layers/:id`

Body:

- `GeoLayer`

Regla:

- `:id` debe coincidir con `body.id`

Respuesta:

- `GeoLayer`

### Append de timeline

`POST /api/internal/test-data/v1/timeline`

Body:

- `TimelineEvent`

Respuesta:

- `TimelineEvent`

## Payloads canónicos

Los payloads deben reutilizar exactamente estos shapes:

- [src/shared/contracts/operational.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts/operational.ts)
  - `Asset`
  - `Alert`
  - `Incident`
  - `GeoLayer`
  - `TimelineEvent`
  - `OperationalScenario`

## Validaciones mínimas

### Para snapshot completo

- `assets`, `alerts`, `incidents`, `layers` y `timeline` deben existir
- el body debe satisfacer `OperationalScenario`
- `Alert.assetId`, si existe, debe apuntar a un `Asset.id`
- `Incident.assetIds[*]` debe apuntar a assets existentes
- `Incident.alertIds[*]` debe apuntar a alerts existentes

### Para upserts

- `body.id` debe coincidir con el parámetro de ruta
- `kind` debe coincidir con la colección
- `updatedAt` debe venir en ISO datetime
- `version` debe ser entero positivo

## Errores recomendados

Envelope sugerido, consistente con el estilo actual:

```json
{
  "error": {
    "code": "invalid_body",
    "message": "Incident references unknown alert ids.",
    "details": {
      "field": "alertIds",
      "value": "alert-404"
    }
  }
}
```

Errores sugeridos:

- `invalid_body`
- `id_mismatch`
- `referential_integrity`
- `not_available_in_environment`

## Ejemplos de inserción

### Crear o actualizar asset

```http
PUT /api/internal/test-data/v1/assets/asset-demo-1
Content-Type: application/json
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
```

Body:

- cualquier `OperationalScenario` válido

## Relación con replay y WebSocket

Si la API interna se implementa sobre el gateway actual:

- `replaceSnapshot` puede disparar `snapshot.replaced`
- `upsert*` puede derivar `*.upserted`
- `appendTimelineEvent` puede derivar `timeline.appended`

Esto la vuelve útil para:

- demos guiadas
- test manual de detalle/lista/mapa
- verificación de convergencia con el stream WebSocket

## Recomendaciones DevOps

- habilitar sólo en `development` y `test`
- exigir header o secret local si queda expuesta fuera de localhost
- registrar mutaciones para reproducibilidad
- no mezclar esta superficie con la API pública consumida por clientes finales

## Gate arquitectónico

Este esquema es compatible con la arquitectura actual si se respetan estas reglas:

- no reemplaza el contrato REST público de lectura
- no introduce shapes paralelos
- no añade semántica nueva fuera del modelo congelado
- mantiene los mismos invariantes del snapshot canónico
