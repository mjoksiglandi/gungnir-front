# Stage 8

## Goal

Derive the WebSocket contract from the replayable transport and leave a delivery package that can be implemented by iteration without contradicting the accepted REST contract.

## Delivered

- shared contract types in `src/shared/contracts/websocket.ts`
- protocol document in [docs/contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
- workstream handoff in [docs/handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md)

## Key decisions

- REST remains the bootstrap source of truth for `live` mode.
- WebSocket carries only incremental mutation delivery in `live` mode.
- Replay compatibility is preserved through ordered mutation frames plus replay control frames.
- External fire hotspots remain outside the canonical operations stream in `v1`.
- Production readiness is not granted yet because the runtime adapter and watermark/resume mechanism still need proof.

## Gate result

- Sequence compatibility with replay mock: satisfied at contract level
- No contradiction with REST bootstrap: satisfied at contract level
- Production implementation proof: pending
