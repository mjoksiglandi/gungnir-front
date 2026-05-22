# REST Contract

## Status

Accepted for the current frozen model on May 13, 2026.

## Scope

This contract is derived from the canonical model in `src/shared/contracts/operational.ts`, the map bootstrap contract in `src/shared/contracts/operations-map.ts`, and the geospatial feed contract in `src/shared/geospatial/contracts.ts`.

It intentionally reflects only the shapes and relations the current frontend already consumes:

- `snapshot` for the operations map bootstrap path
- `list` and `detail` for canonical resources already modeled
- a separate feed endpoint for external fire hotspots

It does not introduce write semantics, pagination, projections, or synthetic DTO wrappers that do not already exist in the frontend model.

## Versioning

- Base path: `/api/v1`
- Current version marker: `v1`
- Success payloads keep the canonical TypeScript shape directly.
- Error payloads use a minimal envelope:

```json
{
  "error": {
    "code": "not_found",
    "message": "asset 'asset-404' was not found.",
    "details": {
      "resource": "asset",
      "id": "asset-404"
    }
  }
}
```

- All versioned endpoints emit `X-Gugnir-API-Version: v1`.
- All current endpoints are `GET` only and send `Cache-Control: no-store`.

## Resource Inventory

### Bootstrap and snapshot

`GET /api/v1/operations/bootstrap`

- Purpose: provide the exact bootstrap object needed by `src/app/operations/page.tsx` and `src/widgets/map-stage-client.tsx`.
- Response shape: `MapStageBootstrap`

`GET /api/v1/operations/snapshot`

- Purpose: provide the current canonical aggregate without geospatial overlays.
- Response shape: `OperationalScenario`

### Canonical entities

`GET /api/v1/assets`

- Response shape: `Asset[]`
- Filters:
  - `assetType`: `air | ground | autonomous | personnel | sensor`
  - `status`: `nominal | degraded | lost`
  - `affiliation`: `friendly | neutral | unknown`
  - `mission`: substring match on `Asset.mission`

`GET /api/v1/assets/:id`

- Response shape: `Asset`

`GET /api/v1/alerts`

- Response shape: `Alert[]`
- Filters:
  - `severity`: `info | low | medium | high | critical`
  - `status`: `open | acknowledged | resolved`
  - `assetId`: exact match on `Alert.assetId`

`GET /api/v1/alerts/:id`

- Response shape: `Alert`

`GET /api/v1/incidents`

- Response shape: `Incident[]`
- Filters:
  - `priority`: `low | medium | high | urgent`
  - `status`: `open | contained | resolved`
  - `assetId`: membership match on `Incident.assetIds`
  - `alertId`: membership match on `Incident.alertIds`
  - `owner`: substring match on `Incident.owner`

`GET /api/v1/incidents/:id`

- Response shape: `Incident`

`GET /api/v1/layers`

- Response shape: `GeoLayer[]`
- Filters:
  - `layerType`: `zone | corridor | route`
  - `visibleByDefault`: `true | false`

`GET /api/v1/layers/:id`

- Response shape: `GeoLayer`

`GET /api/v1/timeline`

- Response shape: `TimelineEvent[]`
- Filters:
  - `category`: `telemetry | alert | incident | operator`
  - `since`: inclusive ISO datetime lower bound on `TimelineEvent.timestamp`
  - `until`: inclusive ISO datetime upper bound on `TimelineEvent.timestamp`

`GET /api/v1/timeline/:id`

- Response shape: `TimelineEvent`

### External geospatial feed

`GET /api/v1/geospatial/fire-hotspots`

- Response shape: `FireHotspotLayer`
- Purpose: expose the normalized external feed independently from the canonical operational snapshot.
- Rationale: `FireHotspot` is not a canonical domain entity and should not be merged into `OperationalScenario`.

## Payload Shapes

### Success payload policy

Success payloads are unwrapped so the frontend can switch from in-process data access to HTTP with minimal adaptation:

- `Asset`, `Alert`, `Incident`, `GeoLayer`, `TimelineEvent`
- `Asset[]`, `Alert[]`, `Incident[]`, `GeoLayer[]`, `TimelineEvent[]`
- `OperationalScenario`
- `MapStageBootstrap`
- `FireHotspotLayer`

### Error payload policy

Current error codes:

- `invalid_query`: query parameter failed enum, boolean, or ISO datetime validation
- `not_found`: requested resource id does not exist in the current snapshot

Example invalid filter:

```json
{
  "error": {
    "code": "invalid_query",
    "message": "Unsupported 'status' value.",
    "details": {
      "field": "status",
      "value": "pending",
      "allowed": "open,acknowledged,resolved"
    }
  }
}
```

## Relationship Semantics

The contract preserves the current model's relationship style instead of expanding embedded documents:

- `Alert.assetId` remains optional and scalar.
- `Incident.assetIds` and `Incident.alertIds` remain arrays of ids.
- `GeoLayer` remains independent.
- `TimelineEvent` remains standalone.

Derived joins needed by detail pages stay client-side or BFF-side:

- asset detail joins `Incident[]` and `Alert[]`
- alert detail joins `Asset` and `Incident[]`
- incident detail joins `Asset[]` and `Alert[]`

This avoids duplicating semantics between snapshot payloads and detail payloads.

## Snapshot Coverage Gate

The current endpoint set satisfies the minimum coverage requested for the frozen model:

- snapshot coverage through `/api/v1/operations/snapshot`
- bootstrap coverage through `/api/v1/operations/bootstrap`
- list coverage for every canonical collection
- detail coverage for every canonical id-bearing model currently in the snapshot
- feed coverage for the external hotspot overlay without promoting it into the canonical domain

## Deliberate Non-Goals

Not included in `v1`:

- mutations such as create, update, delete, acknowledge, assign, or replay control
- pagination, sorting contracts, or collection metadata envelopes
- WebSocket or SSE event streaming
- embedding related entities into detail payloads
- promoting map drawing state or hot-spot records into the canonical operational model
