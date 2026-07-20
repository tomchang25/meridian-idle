# Architecture Foundation 10 — Core Rules Receive Authored Content

Parent Plan: `architecture-foundation.md`

## Goal

Give core rules their authored content as an argument instead of importing it, so the deterministic layer stops naming specific world data, and close the layer rule child 02 had to leave open.

## Summary

Four core rule modules import content lookups directly, which inverts the intended relationship: core is supposed to define what a Port or a Route is, while content supplies particular ones. Today content owns both the record shapes and the instances, and core reaches sideways to read them. That is why the core layer rule still cannot forbid content imports — the one boundary most worth enforcing is the one still unenforced.

This change moves the record shapes into core as the contract they always were, defines a `WorldContent` accessor interface beside them, and threads that interface through every rule that resolves a Port, Product, Product Family, Route, or Supply price. Content keeps authoring the instances and now types them against the core contract, then exposes one `WORLD_CONTENT` object implementing the accessors. Callers — the runtime, the UI, the harness, and tests — pass that object in.

The content argument comes first on every rule that needs it, ahead of state, because it is the most stable of the two: state changes every command, content changes only when the world is re-authored. Rules that touch no content keep their signatures.

Nothing about gameplay moves. Every formula, price, threshold, and message is untouched; the lookups resolve the same records through a parameter rather than an import. The payoff is that core becomes testable against a fabricated world, the chart work can supply a different content set without editing rules, and the lint rule can finally be turned on.

## Relational Context

- Core rules import five things from content today: Port, Product, and Product Family lookups, the Route lookup, and the fixed Supply price table. These five become the whole surface of the `WorldContent` interface, so nothing else in content needs to be reachable from core.
- The record types currently declared in content — Port, Product, Product Family, Route, and the Port catalog entry — move into core. Content imports them so authored data is checked against the contract it claims to satisfy; this is the direction that makes the boundary meaningful rather than decorative.
- The content aggregate keeps its existing named lookups because the UI calls them directly for display, and adds `WORLD_CONTENT` implementing the core interface for rule calls. Both read the same authored arrays, so they cannot disagree.
- The UI calls core rules in five dashboard modules for prices, purchase eligibility, capacity, Port level, and Voyage readiness. Each gains the content argument. The UI is permitted to import content, so it passes `WORLD_CONTENT` directly rather than receiving it through a prop chain.
- The runtime passes content on every rule call it makes. It already imports platform and core; content is a new import for it and is allowed.
- `createMarketSession` takes no content and does not change, but `settlePortEntry` calls it and does take content, so the call stays as it is inside a function whose own signature grew.
- `resolveVoyage` calls the Route lookup, port-entry settlement, the restock plan, and restock. All four need content, so it forwards the same object it received rather than resolving anything itself.
- Catalog validation already takes its catalog as an argument and keeps doing so; its `ContentCatalog` shape stays separate from `WorldContent` because one describes the authored arrays for checking and the other describes lookups for reading.
- The harness scenarios build worlds by calling rules, so each scenario passes content too.
- After the change the core layer rule adds content to its forbidden list, and the known-exception section in the structure standard is removed rather than reworded, because the exception no longer exists.
- Wrong shape to avoid: a module-level default content binding inside core so callers can omit the argument. That is the import again, hidden behind a default.
- Wrong shape to avoid: putting content on game state. Content is authored and shared; state is per-save and persisted, and merging them would push the world into every save file.

## Scope

### Included

- Record types and a `WorldContent` accessor interface owned by core.
- Content typed against those records, exposing `WORLD_CONTENT`.
- A content parameter on every rule that resolves authored data, and on their transitive callers.
- Updated call sites in the runtime, UI, harness, and tests.
- Turning on the core-to-content lint rule and deleting the documented exception.

### Excluded

- Any gameplay, formula, price, threshold, or message change.
- Any change to authored world values.
- Replacing the UI's direct display lookups, which stay as they are.
- Any change to catalog validation's separate catalog shape.

## Files to Change

| File                                                      | Change Size | Purpose                                               |
| --------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| `src/core/content/world-content.ts`                       | Medium      | New: record types and the accessor contract           |
| `src/content/{products,ports,routes}.ts`                  | Small       | Type authored data against the core records           |
| `src/content/catalog.ts`                                  | Small       | Export `WORLD_CONTENT` alongside the existing lookups |
| `src/core/rules/{cargo,market,progression,voyage}.ts`     | Large       | Take content instead of importing it                  |
| `src/runtime/game-runtime.ts`                             | Small       | Pass content on every rule call                       |
| `src/ui/dashboard/**`                                     | Medium      | Pass content at five call sites                       |
| `src/harness/scenarios/*.ts`                              | Small       | Pass content when building worlds                     |
| `tests/**`                                                | Large       | Pass content; core tests may use a fabricated world   |
| `eslint.config.mjs`, `dev/standards/project_structure.md` | Small       | Enforce the boundary and drop the exception           |

## Execution Outline

1. Define the record types and the accessor interface in core, then retype the authored content modules against them and export `WORLD_CONTENT`.
2. Thread the content parameter through the rules, following the compiler outward until every caller supplies it.
3. Update the runtime, UI, harness, and tests to pass `WORLD_CONTENT`.
4. Add content to the core layer restriction, delete the known-exception section, and prove the rule bites with a deliberate violation before removing the probe.
5. Run verification including the browser suite.

## Implementation Notes

- Put the content parameter first and keep every other parameter in its current order, so a missed call site is a type error rather than a silently reordered argument.
- Content record types keep the names they have today, so content modules change only their import line and not their declarations.
- The interface exposes lookups rather than the raw arrays, because rules only ever resolve by identifier; handing over arrays would let a rule iterate authored data and re-introduce content knowledge in a new form.

## Edge Cases

| Case                                     | Expected Handling                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| A rule that touches no content           | Signature unchanged                                                     |
| A lookup that finds nothing              | Returns undefined and each rule keeps its existing guard                |
| Tests needing a world that does not ship | Can fabricate one satisfying the interface, which was impossible before |
| Catalog validation                       | Unaffected; it keeps taking the authored arrays                         |

## Acceptance Criteria

1. No core module imports content, and the layer rules reject an attempt to add one.
2. Authored content is typed against the core records, so a record that does not satisfy the contract fails the build.
3. Every rule resolves authored data from what it was given.
4. Gameplay, prices, and messages are unchanged, and the full unit and browser suites pass.
