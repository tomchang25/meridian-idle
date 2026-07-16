# V5 Core 05 — Deterministic Voyage and Offline Arrival

Parent Plan: `v5-core.md`

## Implemented Contract

Routes own duration, risk, Food, and Water requirements. Departure writes one immutable Voyage snapshot and consumes committed Supply cost basis exactly once. `resolveVoyage(state, now)` is the sole arrival transition; it is an idempotent no-op before the boundary or after completion and atomically invokes different-Port market settlement. The React layer only schedules resolution and reuses the same resolver after hydration.

## Verification

Focused voyage tests cover departure validation, exact Supply consumption, elapsed arrival, and replay no-op; browser smoke covers provision, departure, and arrival.
