# Architecture Foundation 05 — Injected Clock and Named Random Streams

Parent Plan: `architecture-foundation.md`

## Goal

Route game time through one injected clock port and derive randomness as named per-domain streams from a single seed, then prove with a contract test that the same seed and the same commands reproduce the same event sequence — the prerequisite for deterministic offline resolution.

## Summary

Time is injected today only as a bare function parameter on the store, and the voyage countdown component reads the wall clock directly, so no single seam controls time. Randomness is worse: one shift-register helper lives inside the market rules, and the voyage seed feeds it directly in a single linear chain. The moment a second consumer — sailing events, then combat — draws from that chain, every draw after it shifts, and two features that never reference each other change one another's outcomes.

This change adds a clock port in the runtime layer with a system implementation, and replaces the store's time function with it so the store and the voyage countdown share one seam. It adds a random module in core: a stream with an explicit interface, and a stream registry that derives an independent seed per named domain from the root seed. The registry is in place for the domains that arrive with sailing events and combat, each drawing from its own derived seed.

A new contract test pins the property the offline work depends on: replaying a fixed command sequence against a fixed seed and a fixed clock yields an identical event sequence, and doing so across a save round-trip yields the same result as running straight through.

The Market is deliberately left on the root seed rather than moved onto a derived named stream. Moving it was attempted and changes every future session's Category Factors, and therefore prices — five tests including a rendered-price assertion caught it. That is a balance change, not a refactor, and the parent plan forbids behavior changes in this child. The Market still owns its own cursor, so the property that matters is unaffected: a new named domain cannot shift its sequence. Migrating it later is a decision about prices and belongs with whoever owns balance.

## Relational Context

- `useGameStore` accepts a `now` function today and passes it to every rule call. It gains a `clock` dependency instead, so tests and the future harness inject one object rather than a bare function; the store returns the clock so presentation shares the same seam.
- The voyage countdown hook currently calls the wall clock directly, which makes the visible countdown untestable and unfreezable. It takes the clock as an argument, and the voyage status panel passes the store's clock through.
- The dashboard store type is derived from the store's return type, so adding the clock there makes it reachable by any dashboard component without a new prop chain.
- The shift-register helper currently exported from the market rules moves into the core random module. The market rules stop exporting it; nothing outside the market rules and their test used it.
- `createMarketSession` keeps its seed parameter and builds its stream from that root seed directly, so its two callers — initial state construction and port-entry settlement — are unchanged and every existing price is preserved. The grandfathering is stated at the call site so it reads as a decision rather than an oversight.
- Stream derivation must be a pure function of root seed and domain name, with no shared mutable cursor between domains. That independence is the entire point: a new domain must not shift an existing one.
- The voyage seed remains the root seed persisted in state, and port-entry settlement still passes it into market session creation. No save field is added or changed.
- The seed source port stays in the runtime layer and keeps producing the root seed from secure randomness; this change does not touch how a voyage acquires its seed.
- Wrong shape to avoid: a global random singleton or a module-level cursor. Every stream is constructed from an explicit seed so a replay can reconstruct it exactly.
- Wrong shape to avoid: making the clock a core concern. Core rules receive explicit timestamps as arguments and must stay free of any ambient time source.

## Scope

### Included

- A clock port with a system implementation, injected into the store and the voyage countdown.
- A core random module: a stream interface with an implementation, and per-domain derivation from a root seed.
- The stream registry, with the Market grandfathered onto the root seed so no price moves.
- A same-seed, same-commands replay contract test including a save round-trip.

### Excluded

- Offline resolution itself, which the v5-core plan owns.
- Any new random consumer such as sailing events or combat.
- Changing how the root seed is generated or persisted.
- Freezing or advancing time from tests through a debug interface, which is the next child.

## Files to Change

| File                                                    | Change Size | Purpose                                                     |
| ------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `src/runtime/clock.ts`                                  | Small       | New: the clock port and its system implementation           |
| `src/core/random/random-stream.ts`                      | Small       | New: the stream interface and shift-register implementation |
| `src/core/random/random-streams.ts`                     | Small       | New: per-domain seed derivation and stream registry         |
| `src/core/rules/market.ts`                              | Small       | Consume the named market stream; drop the local helper      |
| `src/runtime/use-game-store.ts`                         | Medium      | Take and expose the clock instead of a time function        |
| `src/ui/dashboard/voyage/*.tsx`, `use-voyage-clock.ts`  | Small       | Read time through the injected clock                        |
| `tests/determinism.test.ts`                             | Medium      | New: the replay contract                                    |
| `tests/use-game-store.test.tsx`, `tests/market.test.ts` | Small       | Inject a clock; cover stream independence                   |

## Execution Outline

1. Add the core random module and move the shift-register helper into it, having the market read a stream seeded with the root seed so prices are untouched.
2. Add the clock port, replace the store's time function, and thread it through the voyage countdown.
3. Add the replay contract test covering a straight run, a repeated run, a save round-trip, and a long-delayed resolution.
4. Run verification.

## Implementation Notes

- Derivation mixes the domain name into the root seed with a string hash, then normalizes away zero, because a zero state makes a shift register produce only zeros.
- The stream exposes both a raw unsigned draw and a unit-interval draw so callers do not each re-derive the scaling; market factor construction uses the unit interval exactly as the current code does.
- The replay test asserts the event sequence, not the final state, because events are the contract the later offline work replays against; asserting state alone would pass even if two runs reached the same place by different routes.

## Edge Cases

| Case                           | Expected Handling                                                              |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Root seed of zero              | Normalized to a non-zero state so the stream never degenerates                 |
| Two different domain names     | Produce independent sequences from the same root seed                          |
| Same domain name and root seed | Reproduce the identical sequence on every construction                         |
| Save round-trip mid-sequence   | Continuing from the loaded save yields the same events as an uninterrupted run |

## Acceptance Criteria

1. Running the same commands against the same seed and clock produces an identical event sequence, verified across a repeated run and a save round-trip.
2. Adding a new named domain does not change any existing domain's sequence.
3. Time reaches the store and the voyage countdown through one injected clock; no production module outside the clock implementation reads the wall clock.
4. Every existing price is unchanged; no authored balance moves in this child.
