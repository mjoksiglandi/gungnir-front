# Gugnir Console Front

Frontend-first operational console for a C4-style platform. This repo starts with the web experience and mock operational contracts before wiring real backend and telemetry services.

## Current Scope

- `Next.js` App Router frontend
- `operations` map-first command surface
- dedicated `alerts`, `incidents`, and `assets` views
- typed mock scenario for assets, alerts, incidents, geo layers, and timeline events
- structure ready to evolve toward API bootstrap plus WebSocket live updates

## Local Development

```bash
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/operations`.

## Key Paths

- `src/app/operations` primary operational workspace
- `src/app/alerts` alert feed slice
- `src/app/incidents` incident coordination slice
- `src/app/assets` asset registry slice
- `src/shared/contracts/operational.ts` canonical frontend domain contracts
- `src/shared/mock/scenario.ts` in-memory scenario data backing the UI
- `src/widgets` reusable shell and visualization components

## Next Recommended Steps

1. Add a replay-capable mock transport layer behind the current scenario.
2. Introduce real map rendering with `MapLibre` or `Cesium` once the visual language is approved.
3. Add entity detail routes and selection state.
4. Define the backend-facing REST and WebSocket envelopes from the current contracts.
