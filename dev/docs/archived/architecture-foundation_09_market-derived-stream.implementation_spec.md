# Architecture Foundation 09 — Market Session on a Derived Named Stream

Parent Plan: `architecture-foundation.md`

## Goal

Move Market session creation onto the derived `market-session` stream so every random domain seeds itself the same way, and remove the grandfather exception child 05 left in the code.

## Summary

Child 05 built a stream registry that derives an independent seed per named domain, then deliberately did not use it for the Market: the Market kept building its stream straight from the root seed so no price would move inside a refactor. That was the right call for a refactor, but it left the only existing random consumer as a documented exception to the rule the registry exists to enforce.

This change deletes the exception. Market session creation asks the registry for its named stream like any other domain would, so the next domain to arrive — sailing events, then combat — is added by the same one-line step with nothing to explain.

What moves: for a given root seed, the five Category Factors differ from before. What does not move: the authored band, the sampling arithmetic, the number of draws, the session identifier, the Specialty supply rule, and every price formula. The band is still 0.85 through 1.20 in hundredth steps, and the draw count is unchanged, so the distribution a player experiences is identical. Seeds come from secure randomness at runtime, so no player can observe the difference; only tests that pin a literal seed see it.

Persisted saves are unaffected. A Market session stores its factors, so a loaded save keeps exactly the factors it was created with; only sessions created after this change use the new derivation.

The cost is updating the test literals that encode prices derived from a fixed seed. Those literals are consequences of a random sample, not authored balance, so updating them records the new sample rather than restating a decision.

## Relational Context

- `createMarketSession` currently calls the stream constructor directly with the root seed. It changes to ask the registry for the `market-session` domain; the seed parameter, the session identifier derivation, the loop, and the factor arithmetic all stay exactly as they are.
- The registry already exposes `market-session` as its only declared domain, so no new domain name is introduced and the registry's type does not change.
- Two callers construct sessions — initial state and port-entry settlement — and neither changes, because the seed parameter and return shape are untouched.
- Market prices are derived from the session's stored factors on every read, so every price assertion pinned to a fixed seed shifts together and consistently. Assertions written against the session's own factors rather than against literals are unaffected by construction.
- The determinism contract from child 05 continues to hold: the same root seed still reproduces the same factors, because derivation is a pure function of root seed and domain name. Only the mapping changes, not its reproducibility.
- The grandfather comment at the call site and the corresponding paragraph in the archived child 05 spec are the code's record of the exception; the code comment must go, while the archived spec is history and stays as written.
- The known-exception note in the structure standard covers the core-to-content dependency, not this one, so it is not touched here.
- Wrong shape to avoid: keeping the direct constructor call available "for compatibility". A second way to seed the Market is the exception under a different name.

## Scope

### Included

- Market session creation via the derived named stream.
- Removing the grandfather comment and the now-unused direct stream import.
- Updating the test literals that encode prices from a fixed seed.

### Excluded

- Any change to the authored band, the sampling arithmetic, the draw count, or any price formula.
- Any change to the session identifier, Specialty supply, or persisted schema.
- Adding new random domains.
- Balance tuning of any kind; the new factors are a different sample, not a chosen one.

## Files to Change

| File                        | Change Size | Purpose                                                |
| --------------------------- | ----------- | ------------------------------------------------------ |
| `src/core/rules/market.ts`  | Small       | Seed the session from the registry; drop the exception |
| `tests/market.test.ts`      | Small       | Update literals derived from fixed seeds               |
| `tests/progression.test.ts` | Small       | Update literals derived from fixed seeds               |
| `tests/dashboard.test.tsx`  | Small       | Update rendered price literals                         |

## Execution Outline

1. Switch `createMarketSession` to the registry, remove the grandfather comment, and adjust the import.
2. Run the suite and update each failing literal to the value the new sample produces, confirming per failure that only the number changed and not the assertion's intent.
3. Confirm the determinism contract and the stream-independence tests still pass untouched, since they assert reproducibility rather than specific values.
4. Run verification including the browser suite.

## Implementation Notes

- Update failing literals one at a time from the reported actual value. Do not rewrite an assertion to compute its own expectation, which would hide a real regression behind a tautology.
- The registry memoizes a stream per domain, so a session built from one registry instance draws a single sequence; construct the registry inside the function as the other consumers would, rather than hoisting it to module scope where it would share a cursor across sessions.

## Edge Cases

| Case                              | Expected Handling                                                 |
| --------------------------------- | ----------------------------------------------------------------- |
| Root seed of zero                 | Derivation normalizes it, as it already does for every domain     |
| A save created before this change | Loads with its stored factors; nothing recomputes them            |
| Same root seed, same port         | Reproduces the same factors, as the determinism contract requires |

## Acceptance Criteria

1. Market session creation uses the derived named stream, and no module seeds a random domain any other way.
2. Category Factors stay within the authored band and prices remain consistent with the session that produced them.
3. The determinism and stream-independence contracts pass unchanged.
4. Loading a save created before this change is unaffected.
