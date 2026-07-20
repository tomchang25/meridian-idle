# Architecture Foundation 01 — Layer Boundary Enforcement

Parent Plan: `architecture-foundation.md`

## Goal

Make the documented layer dependency rules mechanically enforced by ESLint inside `npm run verify`, so a forbidden cross-layer import fails verification instead of surviving as an undetected convention drift.

## Summary

The project's placement rules live in `dev/standards/project_structure.md` but nothing checks them. This change adds per-layer `no-restricted-imports` blocks to the existing flat ESLint config — no new dependencies — encoding the dependency matrix the codebase already follows today (verified clean on the current tree, so the change lands with zero violations to fix).

The enforced matrix: `game/domain` may import nothing outside itself and no UI framework; `game/application` may import domain and infrastructure; `game/infrastructure` may import domain and application (application owns injectable port contracts such as the seed source, and adapters implement them); `game/features` may import domain and application but never infrastructure or `app/`. The three inner layers additionally ban parent-relative imports so the alias-based patterns cannot be evaded, while `game/features` keeps its existing feature-internal relative imports.

Landed result: `npm run lint` (and therefore `verify`) rejects any new import that crosses a forbidden boundary, and the structure standard records that the rules are lint-enforced.

## Relational Context

- `eslint.config.mjs` uses ESLint 9 flat config via `defineConfig` with `eslint-config-next` presets; new restriction blocks are appended as additional config objects scoped by `files` globs, and `eslint-config-prettier` must remain last.
- `game/domain/**` currently imports only `@/game/domain/*` modules and has zero external imports (verified); the block bans `react`, `react-dom`, `next`, and the `@/game/application/*`, `@/game/infrastructure/*`, `@/game/features/*`, `@/app/*` alias groups.
- `game/application/use-game-store.ts` imports React hooks, domain rules, and infrastructure classes (`IndexedDbSaveRepository`, `loadSave`, `browserSeedSource`) directly; application → infrastructure therefore stays allowed until plan child 07 revisits construction. The block bans only `@/game/features/*` and `@/app/*`.
- `game/infrastructure/random/crypto-seed-source.ts` imports the `SeedSource` type from `@/game/application/seed-source`; this is a port-implementation direction and is deliberately allowed. The infrastructure block bans `@/game/features/*` and `@/app/*` only. `pwa-registration.tsx` legitimately imports React.
- `game/features/**` uses parent-relative imports for feature-internal modules (`../dashboard-helpers`, `../meridian-dashboard.module.css`); the features block must not ban relative imports, only the `@/game/infrastructure/*` and `@/app/*` alias groups.
- All cross-layer imports repo-wide use the `@/` alias (verified); banning `../*` patterns inside domain, application, and infrastructure closes the only evasion path for alias-based restrictions in those layers.
- `game/shared/` is documented but does not exist on disk; add no config block for it (a `files` glob matching nothing is dead config), and child 02's re-mapping will add one when the directory first appears.
- `tests/`, `e2e/`, and `app/` receive no restriction blocks: tests exercise all layers by design, and the route shell is the outermost composition point.
- Wrong shape to avoid: widening a restriction to silence a violation. A violation means code is misplaced; the fix is moving code per the placement test in `dev/standards/project_structure.md`.

## Scope

### Included

- Per-layer import restriction blocks in the ESLint flat config.
- A note in the structure standard that placement rules are lint-enforced.

### Excluded

- Any code moves or import rewrites (none are needed; the tree is currently clean).
- Rules for `game/shared/`, `src/`-layout paths, or the presentation/harness layers (owned by later children).
- CI workflow changes; `verify` already runs lint.

## Files to Change

| File                                 | Change Size | Purpose                                                               |
| ------------------------------------ | ----------- | --------------------------------------------------------------------- |
| `eslint.config.mjs`                  | Medium      | Add four `files`-scoped config objects encoding the dependency matrix |
| `dev/standards/project_structure.md` | Small       | Record that the placement rules are enforced by lint                  |

## Execution Outline

1. Append the four restriction blocks (domain, application, infrastructure, features) to `eslint.config.mjs` before the prettier config entry, using `no-restricted-imports` with `patterns` groups and a `message` per group that names the violated rule and points at the structure standard.
2. Run `npm run lint` and confirm zero violations; if any appear, stop and resolve by relocating the offending code per the placement test, not by relaxing the pattern.
3. Add the enforcement note to `dev/standards/project_structure.md`.
4. Run `npm run verify`.

## Implementation Notes

- Use one config object per layer with `files: ["game/<layer>/**"]` and a single `no-restricted-imports` rule; keep each pattern group's `message` specific (for example: "game/domain must not import application code — see dev/standards/project_structure.md").
- Domain, application, and infrastructure blocks also include a `group: ["../*"]` pattern with a message requiring `@/` alias imports; same-directory `./` imports remain legal everywhere.
- `no-restricted-imports` applies to type-only imports as well; that is intended (a type dependency is still a dependency).
- Dynamic `import()` with non-literal specifiers is not covered by this rule; acceptable, as the codebase has none and introducing one to dodge lint would be visible in review.

## Edge Cases

| Case                                                           | Expected Handling                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Feature-internal parent-relative import (`../dashboard-types`) | Allowed; only the three inner layers ban relative parents        |
| Type-only import across a forbidden boundary                   | Rejected, same as a value import                                 |
| Test file importing infrastructure directly                    | Allowed; `tests/` and `e2e/` have no restriction blocks          |
| New `game/shared/` directory appears                           | Out of scope here; child 02 adds its block when the layer exists |

## Acceptance Criteria

1. A change that imports across a forbidden layer boundary fails `npm run lint` with a message naming the violated rule.
2. The current codebase passes lint and `verify` unchanged.
3. Feature-internal relative imports and all existing legal imports continue to pass.
