# V5 Core MVP Correctness Repair

Parent Plan: none (standalone spec)

## Goal

Bring the existing Child 02–05 prototype back into agreement with the approved content, command-feedback, eligibility, randomness, and deterministic Voyage contracts before visual HUD recovery and final browser-smoke work continue.

## Summary

Product Family becomes the sole owner of Category and Base Price while Product remains the Cargo identity. Voyage seed generation moves behind an injectable application capability backed by `crypto.getRandomValues`; unavailable secure randomness visibly rejects departure without mutating canonical state.

Supply and Product commands retain their explicit domain errors at the application boundary. The dashboard derives Buy eligibility from the same pure validation used by commands, disables purchases for Gold, capacity, lock, or Specialty-stock failures, and exposes the reason in text. Voyage verification expands beyond the current happy path to cover exact arrival, clock rollback, long offline return, persisted reload, deterministic equivalence, and React Strict Mode timer cleanup. HUD styling and the final Playwright journey remain separate follow-up scopes.

## Requirements

1. Product Family owns Category and Base Price so pricing and progression do not duplicate Product metadata.
2. Every newly created Voyage receives a non-zero unsigned seed from an injectable secure source; capability failure is visible and atomic.
3. Domain command failures survive application orchestration and remain available to accessible presentation.
4. Buy controls reflect the same Gold, Cargo Capacity, unlock, and finite Specialty-stock rules enforced by commands.
5. Persisted Voyage resolution is identical at the exact boundary, after reload, and after a long offline interval, and React effect replay cannot duplicate arrival.

## Relational Context

- Authored Product records reference Product Family identity; market pricing and Port settlement read Category and Base Price only through the referenced Family.
- Content validation rejects missing or invalid Family references before gameplay rules consume them; Product remains the only key in Cargo and Market Session net trade.
- Pure Cargo and Market eligibility functions own validation text and are called by both mutation commands and dashboard presentation; the component must not recreate formulas or authority.
- Application orchestration owns transient command feedback together with the current game state so one command result updates both coherently; feedback never enters the save payload.
- The application hook receives time, repository, and seed capabilities through injectable dependencies. The production seed adapter alone touches `crypto.getRandomValues`.
- Seed acquisition occurs only after non-random departure preconditions pass. Missing secure randomness leaves game state unchanged and returns an actionable application error.
- Voyage departure persists its seed and arrival boundary. Every foreground, timer, hydration, reload, or offline path calls the same resolver and records the persisted boundary as the deterministic arrival time.
- React effects may schedule and clean up timers but do not own elapsed-time semantics; Strict Mode replay must leave one observable arrival result.
- Dashboard changes in this scope add semantic disabled reasons and error feedback only; the unused HUD CSS Module and layout restoration belong to the next visual subsection.
- Playwright remains unchanged in this scope; the later smoke subsection owns truthful journey naming and Product trade, reload, and offline browser coverage.

## Scope

### Included

- Product Family content ownership and validation.
- Injectable cryptographic Voyage seed generation.
- Application command feedback and shared Buy eligibility.
- Deterministic Voyage fixes and focused domain, persistence, hook, and rendered tests.

### Excluded

- HUD layout or CSS restoration.
- Playwright smoke journey changes or execution.
- Child 06–08 gameplay.
- Closeout before independent review and human confirmation.

## Files to Change

| File                                               | Change Size | Purpose                                                                                                   |
| -------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `game/domain/content/core-content.ts`              | Large       | Separate Product Family metadata from Product identity and validate references.                           |
| `game/domain/rules/cargo.ts`                       | Medium      | Share Supply purchase eligibility between command and UI.                                                 |
| `game/domain/rules/market.ts`                      | Medium      | Read Family pricing data and share Product purchase eligibility.                                          |
| `game/domain/rules/progression.ts`                 | Small       | Resolve persisted reference values through Product Family.                                                |
| `game/domain/rules/voyage.ts`                      | Medium      | Separate departure eligibility and stabilize arrival results.                                             |
| `game/application/use-game-store.ts`               | Large       | Inject capabilities and retain transient command errors coherently.                                       |
| `game/application/seed-source.ts`                  | Small       | Define the randomness capability port.                                                                    |
| `game/infrastructure/random/crypto-seed-source.ts` | Small       | Implement secure non-zero unsigned seed generation.                                                       |
| `game/features/dashboard/meridian-dashboard.tsx`   | Medium      | Render command feedback and shared Buy disabled reasons.                                                  |
| `tests/`                                           | Large       | Verify content, eligibility, seed failure, persistence, offline timing, Strict Mode, and rendered states. |

## Execution Outline

1. Split Product Family metadata from Product identity, update pricing and progression callers, and extend content tests.
2. Extract shared Supply, Product, and Voyage eligibility; add the seed capability and application dependency injection.
3. Refactor application state coordination so each command preserves its error without persisting presentation feedback.
4. Wire accessible Buy disabled reasons and application feedback into the dashboard without touching HUD styling.
5. Expand Voyage domain, persistence, hook, Strict Mode, and rendered tests; run full repository verification.

## Implementation Notes

- Family IDs may initially be one-to-one with Product IDs; ownership separation, not forced data reuse, is the required contract.
- A secure source returning zero retries a bounded number of times, then reports unavailability rather than substituting time or `Math.random`.
- Successful commands clear the previous command error. Failed commands retain canonical state identity where the underlying domain command is atomic.
- Long-offline resolution may run later, but `arrivedAt` and arrival activity time use `plannedArrivesAt` so the persisted result does not depend on callback timing.

## Edge Cases

| Case                                                       | Expected Handling                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unknown Product Family                                     | Content validation reports an error; pricing returns unavailable rather than inventing metadata.      |
| Secure random API missing or repeatedly returns zero       | Departure fails visibly with no Supply, save, or Voyage mutation.                                     |
| Gold, capacity, lock, or Specialty supply blocks Buy       | Command and rendered disabled reason agree exactly.                                                   |
| Resolver called before departure or exact arrival boundary | Clock rollback is a no-op; the exact boundary completes once.                                         |
| Reload or long absence after arrival boundary              | The same destination Session, accounting, activity identity, and arrival timestamp are produced once. |
| Strict Mode remount                                        | Timer cleanup prevents duplicate observable arrival or save mutation.                                 |

## Acceptance Criteria

1. Product pricing and Port XP use Category and Base Price owned only by Product Family while Cargo and net trade remain keyed by Product.
2. Voyage departure uses injected secure randomness and visibly rejects missing randomness without changing canonical state.
3. Failed Product or Supply commands expose an actionable application error; a later successful command clears it.
4. Product and Supply Buy controls are disabled for every applicable lock, Gold, capacity, and finite-stock failure, with an associated textual reason.
5. Exact, rollback, foreground, reload, long-offline, and replay paths preserve one deterministic Voyage arrival and accounting outcome.
6. Focused content, command, persistence, React Strict Mode, and rendered-state tests plus `npm run verify` pass; HUD and Playwright work remain explicitly deferred.
