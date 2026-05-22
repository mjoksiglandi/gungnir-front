# Implementation Plan

## Status
Pending explicit approval

## Context

The current frontend already exposes a stable operational model in `src/shared/contracts/operational.ts` and a single typed snapshot in `src/shared/mock/scenario.ts`.

The immediate need is to freeze that model as the frontend source of truth before adding transport, replay, API bootstrap, WebSocket upserts, or detail routes.

This document also records the Next 16 conventions that constrain execution in this repository so future work does not drift into outdated assumptions.

## Decision

1. The canonical domain model for the current backlog is the TypeScript shape declared in `src/shared/contracts/operational.ts`.
2. The canonical fixture for the current UI is `src/shared/mock/scenario.ts`, which must continue satisfying `OperationalScenario`.
3. No new domain entity types will be introduced unless they are required by the existing backlog captured in `README.md`.
4. UI-only state, derived projections, and third-party geospatial data are not part of the canonical domain model unless promoted by an explicit backlog decision.
5. Future REST and WebSocket contracts must be derived from the current canonical model, not the other way around.

## Canonical Model Inventory

### Aggregate root

`OperationalScenario`

- `assets: Asset[]`
- `alerts: Alert[]`
- `incidents: Incident[]`
- `layers: GeoLayer[]`
- `timeline: TimelineEvent[]`

This is the current composition root for the operational surface. It is the canonical aggregate shape currently exercised by the UI, even though it is still mock-backed.

### Entities

`Asset`

- Identity: `id`
- Discriminator: `kind = "asset"`
- Lifecycle metadata: `version`, `updatedAt`, `source`
- Operational identity: `name`, `callsign`, `assetType`, `affiliation`
- Status: `status`
- Spatial state: `position`
- Telemetry adjuncts: `batteryPct?`, `linkQualityPct?`
- Assignment context: `mission`

`Alert`

- Identity: `id`
- Discriminator: `kind = "alert"`
- Lifecycle metadata: `version`, `updatedAt`, `source`
- Classification: `severity`, `status`
- Operator-facing text: `title`, `summary`
- Optional relation anchor: `assetId?`
- Observation time: `observedAt`

`Incident`

- Identity: `id`
- Discriminator: `kind = "incident"`
- Lifecycle metadata: `version`, `updatedAt`, `source`
- Operator-facing text: `title`, `summary`
- Workflow state: `priority`, `status`
- Relations: `assetIds`, `alertIds`
- Accountability: `owner`

`GeoLayer`

- Identity: `id`
- Discriminator: `kind = "geoLayer"`
- Lifecycle metadata: `version`, `updatedAt`, `source`
- Presentation identity: `name`, `layerType`, `visibleByDefault`
- Geometry: `polygon`

`TimelineEvent`

- Identity: `id`
- Time anchor: `timestamp`
- Operator-facing text: `label`, `detail`
- Classification: `category`

### Value objects and enums

`Position`

- `lat`, `lon`
- Optional telemetry detail: `altM`, `headingDeg`, `speedMps`

Shared scalar aliases

- `EntityId = string`
- `IsoDateTime = string`

Enumerations

- `AssetType = "air" | "ground" | "autonomous" | "personnel" | "sensor"`
- `OperationalStatus = "nominal" | "degraded" | "lost"`
- `Severity = "info" | "low" | "medium" | "high" | "critical"`
- `IncidentStatus = "open" | "contained" | "resolved"`
- `AlertStatus = "open" | "acknowledged" | "resolved"`

## Relationships

### Direct relationships

- An `Alert` may reference one `Asset` through `assetId`.
- An `Incident` may reference many `Asset` records through `assetIds`.
- An `Incident` may reference many `Alert` records through `alertIds`.
- `GeoLayer` has no direct entity references in the canonical model.
- `TimelineEvent` is currently standalone and not keyed to another entity.

### Derived relationships already present in UI

- `MapStageClient` derives alert markers from `Alert.assetId` plus the referenced `Asset.position`.
- `MapStageClient` derives route polylines from the subset of `Asset` where `assetType` is `air` or `autonomous`.
- `IncidentsPage` derives board columns from `Incident.status`.
- `AssetsPage` derives visible metrics directly from `Asset`.
- `AlertsPage` derives operator cards directly from `Alert`.

These are read-model projections, not new domain entities.

## Invariants

### Structural invariants

- Every canonical entity except `TimelineEvent` carries `id`, `kind`, `version`, `updatedAt`, and `source`.
- `scenario` must satisfy `OperationalScenario` without runtime coercion.
- `kind` is a closed discriminator per entity type and should remain stable for transport contracts.
- `position` is mandatory for every `Asset`.
- `polygon` is mandatory for every `GeoLayer`.

### Referential invariants

- If `Alert.assetId` is present, it should reference an existing `Asset.id`.
- Every `Incident.assetIds[*]` should reference an existing `Asset.id`.
- Every `Incident.alertIds[*]` should reference an existing `Alert.id`.

These invariants are assumed by current UI code even though they are not yet runtime-validated.

### Current semantic commitments

- `timeline` is part of the canonical scenario shape, but it is not yet consumed by the current route set. Its presence is canonical; its UI projection is deferred.

### Transport design assumptions

- `version` and `updatedAt` are the strongest existing candidates for future upsert semantics, but that transport behavior is not enforced by the current code.
- `source` is canonical metadata that should survive transport design, but the current repo does not constrain it to telemetry-only origins.

## Non-Canonical State And Data

The following concepts exist in implementation but are not part of the frozen domain model:

- `FireHotspot` fetched in `src/widgets/map-stage-client.tsx` from an external ArcGIS feed.
- `DrawnGeofence` created interactively in `src/widgets/map-stage-client.tsx`.
- View state such as `selectedAssetId`, `showDeviceSidebar`, `showLayerPanel`, `deviceFilter`, `searchQuery`, and `basemapMode`.
- Presentation toggles collected in `layerState`.
- Derived collections such as `visibleAssets`, `routePath`, and `incidentSignals`.

Decision: these remain UI concerns or external overlays until a backlog item explicitly promotes them into the domain.

## Backlog Boundary

The backlog recorded in `README.md` currently allows:

1. A mock transport layer with replay over the current scenario.
2. Integration of real geospatial data and external operational feeds.
3. Detail routes by entity and persistent selection state.
4. REST and WebSocket contracts derived from the current model.

The backlog does not currently justify:

- New core entity families beyond `Asset`, `Alert`, `Incident`, `GeoLayer`, and `TimelineEvent`.
- Promotion of drawing tools, map overlays, or hot-spot feed records into the canonical domain model.
- Splitting the model into separate backend-first schemas before transport contracts are defined.

Decision: do not expand the domain outside these backlog items without a new explicit decision.

## Next 16 Constraints

The repository uses `next@16.2.6` with the App Router under `src/app`. The following conventions are execution constraints, not optional style choices.

### Router and file conventions

- The application is App Router based, not Pages Router based.
- Route entrypoints are file-convention driven under `src/app`, including `page.tsx` and `layout.tsx`.
- The root route currently redirects server-side from `src/app/page.tsx` to `/operations` using `redirect` from `next/navigation`.

### Server and client boundaries

- Pages and layouts are Server Components by default in Next 16.
- Interactive map functionality lives behind explicit client boundaries via `"use client"`.
- `src/widgets/map-stage.tsx` is a client boundary and dynamically imports `map-stage-client` with `ssr: false`, which is required because Leaflet depends on browser APIs.
- Props passed from server-rendered routes into client components must remain serializable.

### Async request-time APIs

- In Next 16, `params`, `searchParams`, `cookies`, `headers`, and `draftMode` must be treated as async request-time APIs.
- The current route set does not use dynamic segments yet, but any future detail route must follow the async `params` model from day one.
- When dynamic routes are added, prefer Next-generated `PageProps` and `LayoutProps` helpers instead of hand-rolled synchronous assumptions.

### Build and configuration constraints

- Turbopack is the default execution path for `next dev` and `next build` in Next 16.
- Because `next.config.ts` is currently empty, the project is aligned with the default Next 16 build path.
- If a future change introduces custom `webpack` configuration, production builds can fail unless the build path is made explicit. Valid paths documented by Next 16 include migrating the config to top-level `turbopack` options, using `next build --webpack`, or using `next build --turbopack` to intentionally ignore `webpack` configuration.

### Implications for this repo

- Keep browser-only mapping logic inside client modules.
- Keep route modules thin and server-safe so the typed scenario can later be replaced by API bootstrap without restructuring the tree.
- Treat the contract layer in `src/shared/contracts` as framework-agnostic TypeScript, but respect that any server-to-client boundary will serialize those shapes.
- Avoid designing future detail routes around synchronous route params because that conflicts with Next 16 semantics.

### Local documentation consulted

- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Decision Record

### Target decision once approved

- The frontend source of truth is the current operational contract set plus the current scenario fixture.
- The repo should evolve by adding transport and projections around this model, not by broadening the model preemptively.
- Next 16 App Router and server/client boundaries are first-class architectural constraints.

### Explicit approval still required

Approval should confirm both statements:

1. The current canonical shape is exactly `OperationalScenario` plus its referenced entities and enums as defined today.
2. No additional domain entities will be introduced until demanded by an existing or newly approved backlog item.

Suggested approval text:

`Approved: OperationalScenario and its current referenced entities/enums are the source of truth, and no new domain entities may be added outside the approved backlog.`

## Consequences

What becomes easier:

- Defining REST bootstrap payloads and WebSocket upserts from one stable shape.
- Adding runtime validation later without renegotiating the entity inventory.
- Reviewing future PRs against a documented domain boundary and a documented Next 16 execution model.

What becomes harder:

- Adding map-driven concepts directly into the contracts layer without an explicit scope decision.
- Introducing backend-first schema changes that diverge from the current UI contract.
- Reusing outdated Next.js assumptions, especially around synchronous request APIs or implicit client execution.
