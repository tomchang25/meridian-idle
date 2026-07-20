# Architecture Foundation 04 — Content Catalogs and Cross-Reference Validation

Parent Plan: `architecture-foundation.md`

## Goal

Split authored world data into per-domain catalog modules behind one aggregating entry point, and replace the partial runtime validator with a test-time validator that proves every cross-reference resolves, so the navigation graph arriving with the chart work cannot ship broken links.

## Summary

All authored content lives in one module today: product families, products, ports, routes, supply prices, lookups, and a validator. The validator covers products and ports but does not check routes at all — an unknown endpoint, a duplicate route identifier, a self-route, or a port no ship can reach would pass today's suite silently. Product specialty origins are likewise unchecked against the port list.

This change authors each domain in its own module — products, ports, routes, supplies — and keeps a single aggregating catalog module that owns the lookup helpers, so consumers import from one place. The validator moves out of the shipped module into a dedicated validation module that only tests import, which keeps it out of the production bundle while keeping it next to the content it describes.

The validator gains the checks that matter for graph-shaped content: route endpoints must exist, routes may not be self-loops or share identifiers, distance and duration must be positive, static risk must be a probability, required supplies must be non-negative whole numbers, product specialty origins must name a real port, and every port must be reachable from the starting port by following routes. Diagnostics become structured records carrying a code and the offending entry's identifier rather than bare sentences, so a failure names what to fix.

No authored value changes. The world is the same three ports, sixteen products, and six routes; only its file layout, validation depth, and diagnostic shape change.

## Relational Context

- Core rules import content lookups directly (`getPort`, `getRoute`, `getProduct`, `getProductFamilyForProduct`, `SUPPLY_PRICES`) from the single content module. Those import paths move to the aggregating catalog module, so every core rule import updates; the lookup names and behavior are unchanged so no rule logic moves.
- The UI activity log also imports a port lookup from content and updates the same way.
- The aggregating catalog module re-exports the authored arrays and the domain types so no consumer needs to know which per-domain module holds a given record. Consumers must not import the per-domain modules directly; the aggregate is the contract.
- The existing content test asserts port count, product shape, family metadata, and supply prices, and calls the validator expecting an empty result. It keeps those assertions and switches to the new validator and diagnostic shape.
- The validator is imported only by tests. This is what keeps it out of the shipped bundle; adding a production import would silently reverse that, so it stays unimported by `src/core`, `src/runtime`, `src/ui`, and `src/platform`.
- Content is restricted by the layer rules from importing anything outside core, so the validator may use core model types but must not reach into rules or state.
- Reachability is validated from a starting port declared in content. Core's initial state separately hardcodes the same starting port and known port list; that duplication is pre-existing content-in-core coupling and is not resolved here, but the content-side declaration is the one the validator trusts.
- Wrong shape to avoid: making the validator run at import time or from application code. It is a test-time proof about authored data, not a runtime guard, because content is compiled into the bundle and cannot change after build.
- Wrong shape to avoid: letting a per-domain module import a sibling per-domain module to resolve a reference. Cross-domain resolution belongs to the aggregate and the validator, so authored modules stay plain data.

## Scope

### Included

- Per-domain authored modules for products, ports, routes, and supplies.
- One aggregating catalog module owning re-exports and lookups.
- A test-time validation module with structured diagnostics.
- Route, reachability, and specialty-origin checks that do not exist today.
- Updating every content import to the aggregate.

### Excluded

- Any change to authored values, prices, catalogs, routes, or world size.
- The navigation graph itself, which the chart plan owns.
- Inverting the core-to-content dependency, which remains a known follow-up.
- Removing the starting port and known port list hardcoded in core state.

## Files to Change

| File                                                       | Change Size | Purpose                                                            |
| ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `src/content/products.ts`                                  | Medium      | New: product family and product records with their types           |
| `src/content/ports.ts`                                     | Medium      | New: port records, catalog helper, starting port                   |
| `src/content/routes.ts`                                    | Medium      | New: route records with their type                                 |
| `src/content/supplies.ts`                                  | Small       | New: fixed global supply prices                                    |
| `src/content/catalog.ts`                                   | Medium      | New: aggregate re-exports and lookup helpers                       |
| `src/content/core-content.ts`                              | Large       | Removed; its contents move to the modules above                    |
| `src/content/catalog-validation.ts`                        | Medium      | New: structured cross-reference validation, imported only by tests |
| `src/core/rules/*.ts`, `src/ui/dashboard/activity-log.tsx` | Small       | Import from the aggregate                                          |
| `tests/content.test.ts`                                    | Medium      | Assert the new diagnostics and cover each failure class            |

## Execution Outline

1. Create the four authored modules by moving records verbatim out of the current content module, keeping each type next to the data it describes.
2. Create the aggregate with re-exports and the existing lookup helpers, then delete the old module and repoint every consumer import.
3. Add the validation module: port the existing product and port checks to structured diagnostics, then add the route, specialty-origin, and reachability checks.
4. Rewrite the content test to assert a clean catalog and to prove each new check fires, by validating deliberately broken fixtures rather than by mutating the real catalog.
5. Run verification.

## Implementation Notes

- Diagnostics carry a stable code, the offending entry identifier, and a message; the code is what tests assert so message wording stays free to change.
- The validator takes the catalog as an argument rather than reading module globals, so broken fixtures can be validated without mutating shipped content. This is the only way step four's negative tests can exist.
- Reachability follows directed routes from the starting port; a port with inbound routes but no path from the start is still unreachable and must be reported.
- Keep the port catalog authoring helper that expands basic, advanced, specialty, and final tiers; it encodes the tier distribution the validator checks and is not duplicated logic.

## Edge Cases

| Case                                                                  | Expected Handling                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Route naming an unknown port                                          | Reported with the route identifier and the missing port identifier |
| Route whose origin equals its destination                             | Reported as a self-route                                           |
| Two routes sharing an identifier                                      | Reported once with that identifier                                 |
| Port with no path from the starting port                              | Reported as unreachable                                            |
| Product claiming a specialty origin that is not a port                | Reported with the product identifier                               |
| Static risk outside zero to one, or non-positive distance or duration | Reported with the route identifier                                 |

## Acceptance Criteria

1. Authored content is split per domain behind one aggregate, and no consumer imports a per-domain module directly.
2. An unknown reference, duplicate identity, self-route, invalid numeric field, or unreachable port fails the test suite with a diagnostic naming the offending entry.
3. The shipped catalog validates clean, and no authored value changed.
4. Validation code is not reachable from production modules.
