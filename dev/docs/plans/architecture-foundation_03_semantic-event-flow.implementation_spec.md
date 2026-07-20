# Architecture Foundation 03 — Semantic Event Flow

Parent Plan: `architecture-foundation.md`

## Goal

Make domain rules report what happened as semantic events instead of composing player-facing text into game state, so the activity feed, and later the combat, voyage-event, and canvas timeline layers, all attach to one machine-readable record of each outcome.

## Summary

Every rule today writes finished English copy directly into persisted state and re-implements the 24-entry activity cap inline. Six rule functions across three modules do this, each deriving its own activity identifier, and one of them only accepts a caller-supplied identifier so the voyage rule can override it. The result is that domain owns presentation, tests assert display strings, and nothing exists for a future animation or sound layer to subscribe to.

This change adds a `GameEvent` union in core, extends the shared rule result to carry an ordered list of events, and moves identifier derivation, message text, tone, and the cap into one rendering module in the runtime layer. Rules become copy-free; the runtime turns events into activity entries at the single point where command results are folded into state.

Activity output stays byte-identical. Every existing identifier, message, tone, and ordering is preserved, including the voyage arrival sequence where the restock entry must land beneath the arrival entry, and including the caller-supplied restock identifier, which becomes an explicit restock cause on the event rather than a string parameter threaded through the domain.

Two activity producers stay where they are, deliberately. Save migration copy lives in the platform layer and is produced while loading a save rather than as a command outcome; routing it through events would change the save-load contract, which this child does not touch. The world-creation entry does move, because it lives in core and would otherwise leave copy in the domain layer; new-game construction gains a runtime helper that seeds it from an event.

Landed result: no domain rule contains a player-facing string, the activity feed renders identically, and rule tests assert events instead of prose.

## Relational Context

- `RuleResult` is declared in the cargo rules module and re-exported through the market and voyage rules; it gains a required `events` field, so every rule return site including early error returns must be updated. Making the field required rather than optional is deliberate: the compiler then enumerates every site instead of letting one silently emit nothing.
- The runtime store folds every rule result through one `commandResult` helper, which is the single place where events become activity. The voyage arrival timer path and the reward-free command path both flow through it.
- `restockSupplies` currently takes an optional activity identifier so `resolveVoyage` can pass `${voyageId}-restocked`. That parameter is replaced by a restock cause of either manual or voyage-arrival; the renderer derives the identifier from the cause, so the domain no longer names activity rows.
- `resolveVoyage` calls `restockSupplies` internally and merges its activity array. After this change it collects the inner call's events and re-emits them ahead of its own arrival event, because the renderer prepends entries in order and the arrival entry must end up newest.
- Event order is chronological, oldest first. The renderer prepends each entry in sequence, so the last event in the list becomes index zero of the activity array. The existing voyage test asserting that the restock-failed entry sits at index one depends on this ordering.
- Events carry their own timestamp because arrival events are stamped with the voyage's planned arrival time rather than the current time; a renderer that stamped entries with "now" would change observable output.
- `createInitialGameState` in core currently seeds the world-creation entry. It returns an empty activity list after this change, and the runtime gains a new-game helper that applies the world-creation event. The three store call sites — initial mount, hydration with no save, and explicit new game — all use that helper.
- `loadSave` in the platform layer calls `createInitialGameState` on the version-one migration path and then replaces the activity array wholesale, so it is unaffected by the seed entry moving.
- The activity log component reads `state.activity` and is not changed; it stays a pure reader of persisted state, and events never reach the UI layer.
- The persisted schema is unchanged: activity entries remain in game state with the same shape, so no save migration is required and existing saves load untouched.
- Wrong shape to avoid: letting UI components consume events for display while activity also renders from them, which would create two owners of the same copy. Events feed the renderer only.
- Wrong shape to avoid: persisting events or reconstructing activity from an event log. The save contract stays snapshot-based.

## Scope

### Included

- A `GameEvent` union in core and an events field on the shared rule result.
- Converting the six copy-writing rule functions to emit events.
- One runtime rendering module owning identifiers, messages, tones, and the entry cap.
- Moving the world-creation entry out of core into a runtime new-game helper.
- Migrating rule tests to assert events, with one focused test owning copy.

### Excluded

- Save-migration activity copy, which remains in the platform layer.
- Any change to copy wording, tone, identifier format, ordering, or the cap value.
- Any new event consumer; canvas timelines and sound are later children.
- Any persisted schema or save-migration change.

## Files to Change

| File                                   | Change Size | Purpose                                                                                |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `src/core/events/game-events.ts`       | Medium      | New: the event union and restock cause                                                 |
| `src/core/rules/cargo.ts`              | Medium      | Rule result gains events; supply purchase and restock emit instead of writing copy     |
| `src/core/rules/market.ts`             | Medium      | Product buy and sell emit instead of writing copy                                      |
| `src/core/rules/voyage.ts`             | Medium      | Departure, arrival, and auto-restock failure emit; inner restock events are re-emitted |
| `src/core/state/initial-game-state.ts` | Small       | Returns an empty activity list                                                         |
| `src/runtime/activity-rendering.ts`    | Medium      | New: the single owner of identifiers, copy, tone, and the cap                          |
| `src/runtime/use-game-store.ts`        | Medium      | Folds events into state; new-game helper seeds world creation                          |
| `tests/*.test.ts`                      | Large       | Assert events; one test owns rendered copy                                             |

## Execution Outline

1. Add the event union in core, then extend `RuleResult` with a required events field and follow the compiler through every rule return site, emitting events while leaving the existing activity writes in place so the suite stays green.
2. Add the runtime rendering module with identifier, message, and tone derivation for every event kind, plus the cap, and cover it with a focused test asserting the exact strings the rules produce today.
3. Switch the store's result folding to render activity from events, then delete the activity writes from the rules in the same step so copy never has two owners.
4. Replace the restock identifier parameter with the restock cause and update the voyage call site.
5. Empty the core seed entry and add the runtime new-game helper; update the three store call sites.
6. Migrate rule tests from string assertions to event assertions and run verification.

## Implementation Notes

- Preserve these exact identifier formats in the renderer: supply purchase uses the timestamp alone, manual restock uses a restock prefix with the timestamp, voyage restock uses the voyage identifier with a restocked suffix, product buy and sell use their product identifier and timestamp, departure uses the bare voyage identifier, arrival and restock failure use the voyage identifier with their suffixes, and world creation uses its timestamp.
- Preserve the two message inconsistencies rather than fixing them here: the product purchase message uses the product's display name while the sale message uses the raw product identifier, and both voyage messages use port identifiers rather than port names. Correcting copy is a separate decision from moving it.
- The sale message includes a signed profit figure with an explicit plus sign for non-negative values; keep the sign logic in the renderer.
- Step 1 and step 3 are deliberately split so the suite never sees a state where events exist but nothing renders them, or where both rules and the renderer write activity.

## Edge Cases

| Case                                       | Expected Handling                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Rule returns an error                      | Emits no events; the error string is unchanged and still returned separately    |
| Restock with targets already met           | Returns its existing error and emits nothing, as today                          |
| Voyage arrival with auto-restock failure   | Emits the failure event then the arrival event, so arrival stays newest         |
| Version-one save migration                 | Replaces the activity array wholesale and is unaffected by the moved seed entry |
| More than the cap of events in one command | Renderer applies the cap once after prepending, matching current behavior       |

## Acceptance Criteria

1. No domain rule module contains player-facing copy or activity-cap logic.
2. The activity feed is identical to before for the same command sequences, including identifiers, ordering, and tone.
3. Rule tests assert semantic events, and exactly one focused test owns rendered copy.
4. The persisted schema is unchanged and existing saves load without migration.
