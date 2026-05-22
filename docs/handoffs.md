# Implementation Handoffs

## Stage 8

This package closes the design handoff for the WebSocket stream derived from the existing replay transport and the accepted REST contract.

Overall certification:

- Contract readiness: ready for iterative implementation
- Production readiness: `NEEDS WORK`

Reason:

- The protocol is defined, but the runtime adapter, ordered live event source, and resume watermark strategy still need implementation evidence.

## Backend Architect

Ownership:

- WebSocket runtime adapter
- ordered event source
- resume cursor semantics
- convergence with REST bootstrap

Deliverables:

- expose `wss://<host>/api/v1/operations/stream`
- terminate WS outside fragile Next App Router Route Handler hosting
- upgrade emitted live mutations from unsequenced `OperationalMutationEvent` to ordered `OperationalOrderedEvent`
- define how `lastSequence` is derived for a freshly bootstrapped client
- normalize replay reset semantics so `snapshot.replaced` can be reasoned about by clients

Acceptance gates:

- live stream emits strictly increasing mutation `sequence`
- resume with `afterSequence` is deterministic
- rejected resume returns `invalid_resume`
- stream payloads preserve canonical model shape used by REST

## Frontend Developer

Ownership:

- client reducer
- bootstrap plus stream hydration flow
- reconnect behavior
- replay-mode UI isolation

Deliverables:

- local store keyed by canonical entities plus `lastAppliedSequence`
- reducer that ignores duplicates and applies mutations in order
- reconnection flow using `afterSequence`
- full reset behavior when `snapshot.replaced` arrives
- separate handling for `replay` control frames so transport state does not pollute domain state

Acceptance gates:

- bootstrap + mutation replay converges to the same shape as `OperationalScenario`
- duplicate frames do not mutate UI state twice
- out-of-band control frames do not break map, lists, or detail pages

## API Tester

Ownership:

- contract validation
- reconnect and replay integration tests
- negative-path verification

Deliverables:

- frame schema tests for `hello`, `mutation`, `replay`, and `error`
- sequence monotonicity tests
- resume acceptance and rejection tests
- convergence test:
  - replay seed + ordered mutations == canonical scenario snapshot
- REST/WS consistency test:
  - bootstrap snapshot + streamed deltas == server state after deltas

Acceptance gates:

- all frame variants validate against shared types
- no duplicate application after reconnect
- invalid cursor path forces clean rebootstrap

## Reality Checker

Ownership:

- release gate review
- evidence-based certification

Required evidence before upgrading from `NEEDS WORK`:

- proof that the chosen runtime keeps WS connections alive in the target deployment
- proof that resume works across disconnects, not only in-process
- proof that bootstrap watermark and mutation sequencing cannot race into divergent client state
- proof that the live adapter behaves consistently with the mock replay contract

Default verdict if evidence is missing:

- `NEEDS WORK`

## Suggested Iteration Plan

### Iteration 1

- add runtime-agnostic shared WS frame types
- add server-side adapter boundary and connection handshake
- expose replay mode with ordered mock frames

Exit criteria:

- mock replay can be consumed end to end through WebSocket frames

### Iteration 2

- add frontend reducer and reconnect flow
- store `lastAppliedSequence`
- validate duplicate and out-of-order handling

Exit criteria:

- UI converges correctly under replay and reconnect simulation

### Iteration 3

- add live ordered mutation source
- define bootstrap watermark strategy
- add invalid resume fallback to rebootstrap

Exit criteria:

- live mode is consistent with REST bootstrap and survives disconnects

### Iteration 4

- harden deployment/runtime adapter
- add observability and transport-level metrics
- run end-to-end evidence for production gate

Exit criteria:

- Reality Checker has enough evidence to revisit the `NEEDS WORK` verdict
