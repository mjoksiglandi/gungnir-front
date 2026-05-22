# WebSocket Contract

## Status

Proposed and implementation-ready for iterative delivery on May 13, 2026.

Reality check: the event contract is ready, but production implementation still needs a WebSocket-capable runtime adapter. Next 16 local docs explicitly warn that Route Handlers are not a safe base for long-lived WebSocket connections.

## Scope

This contract is derived from:

- `src/shared/transport/operational-events.ts`
- `src/shared/transport/mock-operational-transport.ts`
- `src/shared/mock/scenario-replay.ts`
- [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)

It covers:

- event catalog derived from the replayable transport
- ordering and idempotency semantics
- reconnect and resume behavior
- handshake semantics
- implementation constraints needed to keep the stream consistent with REST bootstrap

It does not define write commands over WebSocket in `v1`.

## Transport Surface

- Public endpoint: `wss://<host>/api/v1/operations/stream`
- Subprotocol: `gugnir.operations.v1`
- Framing: UTF-8 JSON
- Primary stream: `operations`

Implementation note:

- This path is the public contract, not a requirement to use a Next App Router `route.ts` for the runtime upgrade.
- In Next 16, Route Handlers are not a reliable long-lived WebSocket host.
- Recommended implementation: terminate WebSocket in a custom Node server, sidecar, or platform-native WS service, then route `/api/v1/operations/stream` to it.

## Session Modes

### `live`

Default mode for the frontend shell.

- Client bootstraps with `GET /api/v1/operations/bootstrap`.
- Stream emits only mutations that occur after the snapshot watermark used for that client session.
- Resume is attempted with `afterSequence`.
- If resume cannot be honored, server sends an `error` frame and client must re-fetch REST bootstrap and reconnect.

### `replay`

Diagnostic and test mode derived directly from `scenarioReplayFrames`.

- Client starts from the replay seed snapshot, not from the current REST bootstrap snapshot.
- Stream emits the ordered build-up represented by `scenarioReplayFrames`.
- Replay control frames expose pause/reset/step/speed state changes without mutating the canonical REST shape.

Constraint:

- `replay` mode exists to prove compatibility with the mock transport.
- The current frontend-facing operational shell should remain on `live` mode unless explicitly entering a replay workflow.

## Connection Request

### Query parameters

- `mode`: optional, `live | replay`, default `live`
- `afterSequence`: optional integer cursor, exclusive lower bound for mutation replay

Example:

```text
wss://example.test/api/v1/operations/stream?mode=live&afterSequence=14
```

## Frame Envelope

All frames are JSON objects with a stable outer discriminator:

- `frameKind`
- `protocolVersion`
- `stream`
- `eventId`
- `emittedAt`

The canonical shared types live in `src/shared/contracts/websocket.ts`.

## Frame Catalog

### `hello`

Sent exactly once after connection acceptance.

Purpose:

- confirm protocol version
- confirm session mode
- advertise REST bootstrap endpoints
- expose replay state metadata needed by tooling and tests

Example:

```json
{
  "frameKind": "hello",
  "protocolVersion": "v1",
  "stream": "operations",
  "connectionId": "conn-01",
  "emittedAt": "2026-05-13T18:00:00.000Z",
  "mode": "live",
  "replay": {
    "supportsResume": true,
    "supportsReplay": true,
    "nextSequence": 15
  },
  "rest": {
    "bootstrapPath": "/api/v1/operations/bootstrap",
    "snapshotPath": "/api/v1/operations/snapshot"
  }
}
```

### `mutation`

Carries ordered state-changing events. This is the core frontend data plane.

Event source:

- `OperationalOrderedEvent`

Allowed event payloads:

- `snapshot.replaced`
- `asset.upserted`
- `alert.upserted`
- `incident.upserted`
- `geoLayer.upserted`
- `timeline.appended`

Example:

```json
{
  "frameKind": "mutation",
  "protocolVersion": "v1",
  "stream": "operations",
  "eventId": "evt-15",
  "emittedAt": "2026-05-13T18:00:02.000Z",
  "event": {
    "sequence": 15,
    "topic": "alert",
    "type": "alert.upserted",
    "occurredAt": "2026-05-13T18:00:01.500Z",
    "entity": {
      "id": "alert-heat-19",
      "kind": "alert",
      "version": 3,
      "updatedAt": "2026-05-13T18:00:01.500Z",
      "source": "fire-sensor",
      "severity": "high",
      "status": "open",
      "title": "Thermal spike detected",
      "summary": "Persistent heat signature expanding along sector south-east.",
      "assetId": "asset-scout-7",
      "observedAt": "2026-05-13T18:00:01.000Z"
    }
  }
}
```

### `replay`

Carries replay session state from the existing mock transport control plane.

Allowed types:

- `replay.started`
- `replay.paused`
- `replay.reset`
- `replay.completed`
- `replay.speed.changed`
- `replay.stepped`

These frames do not change the canonical live snapshot by themselves. The frontend should treat them as transport or tooling state.

### `error`

Terminal or recoverable stream error.

Current codes:

- `invalid_resume`
- `unsupported_mode`
- `unsupported_protocol`

Example:

```json
{
  "frameKind": "error",
  "protocolVersion": "v1",
  "stream": "operations",
  "eventId": "err-01",
  "emittedAt": "2026-05-13T18:00:05.000Z",
  "error": {
    "code": "invalid_resume",
    "message": "Requested afterSequence is no longer available.",
    "retryable": true
  }
}
```

## Ordering

Mutation ordering is defined by `event.sequence`.

- `sequence` is strictly increasing within the `operations` stream.
- Ordering is total for mutation frames, not just per topic.
- `occurredAt` is informational and may collide across events.
- If timestamps collide, `sequence` remains the source of truth.
- Replay ordering must stay compatible with `scenarioReplayFrames`, which already sorts by timestamp, stable rank, and stable key.

Control-plane ordering:

- `replay` frames may arrive between mutation frames.
- Clients must never use `replay` frame order to reorder mutation application.

## Idempotency

Mutation application rules:

- Ignore any mutation with `sequence <= lastAppliedSequence`.
- Apply mutations exactly once in ascending `sequence` order.
- `*.upserted` events are idempotent by `entity.id` plus replacement semantics.
- `timeline.appended` is idempotent by `sequence`, not by `event.id` alone.
- `snapshot.replaced` is a full local rebase and resets local derived projections.

Frontend implication:

- The reducer should store `lastAppliedSequence`.
- Derived joins used by detail pages should recompute from the canonical local store after mutation application.

## Reconnect Semantics

### Happy path

1. Client loads REST bootstrap from `/api/v1/operations/bootstrap`.
2. Client opens WebSocket in `live` mode.
3. Client persists `lastAppliedSequence` locally after each mutation.
4. On disconnect, client reconnects with `afterSequence=<lastAppliedSequence>`.

### Resume accepted

- Server sends `hello`
- Server replays only mutations with `sequence > afterSequence`
- Client continues normal operation

### Resume rejected

- Server sends `error.code = invalid_resume`
- Client closes socket
- Client re-fetches REST bootstrap
- Client reconnects without `afterSequence`

### Replay mode

For replay tests or operator tooling:

1. Client starts from the replay seed snapshot.
2. Client connects with `mode=replay&afterSequence=0`.
3. Client applies mutation frames in order.
4. Client renders replay control frames separately from domain state.

## REST Consistency Rules

To avoid contradiction with REST bootstrap:

- `live` stream mutations must always be defined relative to the snapshot watermark used for the client session.
- The success payload shape for each mutation must remain the same canonical entity or snapshot shape already used by REST.
- The stream must not introduce websocket-only entity shapes.
- External hotspots remain outside the operations mutation stream in `v1`.

This keeps the contract aligned with the current frontend model:

- REST owns initial snapshot hydration
- WebSocket owns incremental mutation delivery
- geospatial hotspot feed remains independently fetched

## Known Gaps Exposed By The Current Mock

The mock transport is good enough to derive the event catalog, but not yet sufficient proof of production readiness.

Gaps:

- `subscribe()` currently emits unsequenced `OperationalMutationEvent`, while the WebSocket contract needs `OperationalOrderedEvent` for resume safety.
- `resetReplay()` emits `snapshot.replaced` outside the ordered replay history.
- The current REST bootstrap payload has no explicit snapshot watermark or `lastSequence`.
- There is no persisted event log for resume beyond the in-memory mock frames.

Decision:

- Treat these as implementation tasks, not contract blockers.
- Do not certify production readiness until these gaps are closed.

## Quality Gates

### Contract gate

- Every mutation event type maps directly to the current canonical model.
- No WebSocket payload contradicts [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md).
- Replay ordering matches `scenarioReplayFrames`.

### Backend gate

- Resume behavior is tested for accepted and rejected cursors.
- Mutation stream carries strict ascending `sequence`.
- Runtime host supports long-lived WebSocket connections outside fragile Route Handler assumptions.

### Frontend gate

- Client reducer applies out-of-order or duplicate frames safely.
- Bootstrap plus replayed mutations converge to the same state as the canonical snapshot.
- Replay control frames do not corrupt canonical entity state.

### API quality gate

- Contract tests validate every frame shape.
- Integration tests prove bootstrap plus stream convergence.
- Disconnect and reconnect behavior is automated.

### Reality gate

- Status: `NEEDS WORK` until a real WS runtime adapter, ordered live stream source, and resume watermark strategy are implemented and tested.
