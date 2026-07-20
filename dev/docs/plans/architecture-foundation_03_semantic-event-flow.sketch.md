# Architecture Foundation 03 — Semantic Event Flow Sketch

Parent Plan: `architecture-foundation.md`

## Goal

Explore moving domain rule outcomes from presentation text embedded in game state to semantic events, so the activity feed, future combat/voyage-event presentation, and canvas animation timelines all attach to one machine-readable record of what happened.

## Summary

Today every domain rule writes player-facing English copy directly into persisted state (for example the departure rule composes "Departed for …" and prepends it to the activity array, and the 24-entry cap is duplicated inside each rule). This couples domain to presentation, makes tests assert display strings, and leaves nothing for a canvas timeline or sound layer to subscribe to.

The favored direction: rule results carry a list of semantic events alongside the new state; exactly one application-layer renderer turns events into persisted activity entries (owning copy and the cap in one place); the persisted save schema is unchanged because activity entries remain in state — only their author moves. Events themselves are transient and never persisted, per the parent plan's non-goal.

This child is a behavior-preserving refactor gated before the v5-core events/items/combat child and before the canvas presentation child, both of which consume events.

## Sketch

- The current rule-result shape is `{ state, error? }` defined in the cargo rules module and shared by all rules. Candidate replacement: `{ state, events, error? }` where events is a readonly array of a discriminated union (`kind` plus event-specific payload). Verify at spec time how many rule functions and call sites exist; today the known writers of activity copy are the voyage rules (depart, resolve, auto-restock failure), and likely the market/cargo/progression rules — enumerate them all during spec authoring.
- Candidate event vocabulary from current behavior: voyage departed, voyage arrived, products bought/sold, supplies bought/discarded/restocked, auto-restock failed, port level progression, migration report acknowledged. Name events after domain facts, never after display intent.
- The single renderer likely lives in the application layer next to the store: it maps each event to an activity entry (message, tone, id, timestamp) and applies the cap once. The `.slice(0, 24)` duplication inside individual rules disappears.
- Event ids and timestamps: rules currently derive activity ids from voyage/route ids and `now`; keep id derivation deterministic from event payload plus the injected time so the same commands still produce identical activity, preserving the parent plan's determinism criterion.
- Persisted schema unchanged: activity entries stay in `V5GameState`; verify no save-migration work is needed because the field shape does not move.
- Test migration: rule tests currently asserting activity strings move to asserting event sequences; one focused renderer test owns copy. This is where most of the diff volume likely lands — verify test count at spec time.
- Wrong shape to avoid: letting UI components consume events directly for display while activity also renders from them, creating two copy owners. UI reads state; events feed the renderer (and, later, presentation timelines in child 08).
- Wrong shape to avoid: persisting events or replaying activity from an event log; the save contract stays snapshot-based.
- Sequencing note: land after child 02 if possible so the diff is written once against the new layout; the two children are otherwise independent.

### Candidate files to inspect

- `game/domain/rules/cargo.ts` (RuleResult owner)
- `game/domain/rules/voyage.ts`
- `game/domain/rules/market.ts`
- `game/domain/rules/progression.ts`
- `game/application/use-game-store.ts`
- `game/domain/models/game.ts` (ActivityEntry, activity field)
- `tests/voyage.test.ts`, `tests/market.test.ts`, `tests/cargo.test.ts`, `tests/progression.test.ts`, `tests/use-game-store.test.tsx`

## Non-Goals

1. No new presentation consumers of events (canvas timelines are child 08; sound does not exist yet).
2. No event persistence, event sourcing, or replay-from-log save model.
3. No copy rewrites or localization work; existing English strings move verbatim into the renderer.
4. No change to error reporting; `error` stays a plain string on the rule result.

## Acceptance Criteria

1. Domain rule modules contain no player-facing copy and no activity-cap logic.
2. The activity feed is byte-identical to before for the same command sequences.
3. Rule tests assert semantic event sequences; exactly one focused test owns activity copy.
4. The persisted save schema is unchanged and existing saves load without migration.
