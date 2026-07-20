# Architecture Foundation 02 — Src Layout Migration

Parent Plan: `architecture-foundation.md`

## Goal

Move the game source from the root-level `app/` and `game/` directories into a unified `src/` layout whose layer names match the sibling tickstrike-web project, so both repositories share one placement vocabulary, one set of boundary rules, and one body of agent guidance.

## Summary

This is a rename-only change: `git mv` plus alias, configuration, and documentation updates, with zero logic change. Every layer keeps its current responsibility and only changes address.

The mapping is `app/` to `src/app/`, `game/domain/` to `src/core/`, `game/domain/content/` to `src/content/`, `game/application/` to `src/runtime/`, `game/infrastructure/` to `src/platform/`, and `game/features/` to `src/ui/`. The `worker/`, `db/`, `drizzle/`, `build/`, `public/`, `tests/`, and `e2e/` directories stay at the repository root because they are deployment, asset, or test concerns rather than game layers.

The `@/*` alias currently resolves to the repository root, so every cross-layer import reads `@/game/domain/...`. It is remapped to `./src/*`, which both shortens every import and makes the alias mean "game source" instead of "anything in the repo". The alias is declared in three places that must move together: `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`.

Two risks are handled explicitly. First, vinext's App Router detection under `src/app/` is verified by an actual production build and dev-server boot rather than assumed, because vinext is pre-1.0. Second, the two unshipped Active specs reference the old paths throughout their Files to Change tables; they are updated in this same change so no in-flight handoff points at an address that no longer exists.

Landed result: `src/` holds all game code under the shared taxonomy, verification passes, the dev server serves the app, and no import, configuration, or current guidance mentions the old layout.

## Relational Context

- The `@/*` alias is declared three times and all three must change together: `tsconfig.json` `compilerOptions.paths` maps `@/*` to `./*`, while `vite.config.ts` and `vitest.config.ts` each map `@` to the repository root through `fileURLToPath(new URL("./", import.meta.url))`. A partial update produces a build that type-checks but fails to resolve at runtime, or the reverse.
- `vite.config.ts` also references `./worker/index.ts` as the Cloudflare worker entry and imports `./build/sites-vite-plugin` and `./.openai/hosting.json`. None of these move; only the alias line changes in that file.
- `vitest.config.ts` sets `setupFiles: ["./tests/setup.ts"]` and `include: ["tests/**/*.test.{ts,tsx}"]`. Tests stay at the root, so both entries are unchanged; only the alias changes.
- `playwright.config.ts` points `testDir` at `./e2e` and runs the app through `wrangler dev`. Nothing in it references the moved directories.
- The child-01 ESLint boundary blocks are addressed by `files: ["game/<layer>/**"]` globs and by restricted alias patterns such as `@/game/features/*`. Every glob and pattern must be re-scoped to the new paths in this same change, or boundary enforcement silently stops applying — a passing lint run would then prove nothing.
- The ESLint re-scope also adds a `src/content/**` block: content depends only on core contracts, so it is restricted from importing runtime, platform, ui, and app.
- Core is **not** restricted from importing content, because the live code does the opposite of the target shape: `src/core/rules/voyage.ts`, `market.ts`, `cargo.ts`, and `progression.ts` all read authored content directly through the content module's lookup helpers. Inverting that dependency so rules receive content instead of importing it is a real behavioral refactor and is out of scope for a rename-only child; it is recorded as a follow-up for the content-catalog child. Adding the restriction here would have forced either a scope breach or a suppression, and both are worse than an honestly deferred rule.
- `app/layout.tsx` imports the PWA registration component from the platform layer and `app/page.tsx` imports the dashboard from the UI layer. Both are outermost-composition imports and stay legal after the move; only their alias prefixes change.
- `public/` is served from URL root and the service worker is registered as `/sw.js`. Static asset URLs are unaffected by a source move; do not rewrite them.
- `app/_sites-preview/` and `app/hud-demo/` are empty and untracked. `git mv` moves tracked files only, so these two directories are left behind and must be removed manually, or the old `app/` directory will survive the migration.
- `dev/tools/check-governance.mjs` and `.prettierignore` contain no references to the moved directories (verified), so neither needs editing.
- The two Active implementation specs — `v5-core-mvp_correctness-repair.implementation_spec.md` and `market_batch-trade-controls.implementation_spec.md` — name old paths in their Files to Change tables and prose. They are updated here because an executable handoff pointing at a nonexistent path would be executed literally.
- Wrong shape to avoid: treating this as an opportunity to also split, rename, or reorganize modules inside a layer. Every file keeps its own name and its position within its layer; only the layer's address changes.

## Scope

### Included

- Moving `app/` and the four `game/` layers into `src/` under the shared taxonomy.
- Remapping the `@/*` alias in all three declaration sites and rewriting every import.
- Re-scoping the child-01 ESLint boundary blocks, including the new content-layer block.
- Updating the structure standard, README, and the two Active specs.

### Excluded

- Any behavior, formula, dependency, or module-splitting change.
- Content splitting and cross-reference validation (child 04).
- Creating `src/presentation/`, `src/harness/`, or `src/shared/` before the children that own them.
- Moving `tests/`, `e2e/`, `worker/`, `db/`, `drizzle/`, `build/`, or `public/`.

## Files to Change

| File                                                                   | Change Size | Purpose                                                                               |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `app/**`, `game/**`                                                    | Large       | Moved to `src/` under the new taxonomy; contents unchanged apart from import prefixes |
| `tests/**`, `e2e/**`                                                   | Medium      | Import prefixes only; files stay in place                                             |
| `tsconfig.json`                                                        | Small       | Remap the `@/*` path to `./src/*`                                                     |
| `vite.config.ts`                                                       | Small       | Remap the `@` alias to the `src` directory                                            |
| `vitest.config.ts`                                                     | Small       | Remap the `@` alias to the `src` directory                                            |
| `eslint.config.mjs`                                                    | Medium      | Re-scope every boundary glob and alias pattern; add the content-layer block           |
| `dev/standards/project_structure.md`                                   | Medium      | Rewrite the ownership table, placement test, and enforcement note for the new layout  |
| `README.md`                                                            | Small       | Rewrite the Structure section                                                         |
| `dev/docs/plans/v5-core-mvp_correctness-repair.implementation_spec.md` | Small       | Update referenced paths                                                               |
| `dev/docs/plans/market_batch-trade-controls.implementation_spec.md`    | Small       | Update referenced paths                                                               |

## Execution Outline

1. `git mv` each layer into its new address, creating `src/` first: `app` to `src/app`, `game/domain/content` to `src/content` (before moving domain, so the nested content directory is not carried into core), then `game/domain` to `src/core`, `game/application` to `src/runtime`, `game/infrastructure` to `src/platform`, `game/features` to `src/ui`. Remove the leftover empty `app/` and `game/` directories.
2. Rewrite import prefixes across `src/`, `tests/`, and `e2e/`. Apply the content prefix before the domain prefix so the longer path wins: `@/game/domain/content/` to `@/content/`, then `@/game/domain/` to `@/core/`, `@/game/application/` to `@/runtime/`, `@/game/infrastructure/` to `@/platform/`, `@/game/features/` to `@/ui/`.
3. Remap the alias in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts` together.
4. Re-scope the ESLint boundary blocks to the new layer paths and add the content block; confirm enforcement still bites by running a deliberate violation through ESLint before deleting the probe.
5. Update the structure standard, README, and the two Active specs.
6. Run `npm run verify`, then boot `npm run dev` and confirm the route renders, since no automated check covers vinext's App Router detection.

## Implementation Notes

- Order matters in step 1: moving `game/domain` before `game/domain/content` would drag the content directory into `src/core/content` and require a second move.
- Order matters in step 2 for the same reason: rewriting `@/game/domain/` first would turn content imports into `@/core/content/`, which is the wrong destination.
- Verify the move preserved history with `git log --follow` on one file per layer. If history breaks, the move was recorded as delete-plus-add and should be redone with `git mv`.
- The ESLint content block restricts `@/runtime/*`, `@/platform/*`, `@/ui/*`, `@/shared/*`, and `@/app/*`, plus the same `../*` rule the other inner layers carry. The core block gains `@/content/*`.
- Do not add a `src/shared/**` ESLint block: the directory still does not exist, and a `files` glob matching nothing is dead configuration.

## Edge Cases

| Case                                                  | Expected Handling                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| vinext fails to detect `src/app`                      | Stop and revert the migration; the layout question returns to the decision gate rather than being worked around with a shim |
| Empty untracked directories under `app/`              | Removed manually; `git mv` does not carry untracked content                                                                 |
| Feature-internal relative imports inside the UI layer | Move unchanged; they remain legal and are not rewritten                                                                     |
| Static asset URLs such as `/sw.js`                    | Unchanged; a source move does not affect served URL paths                                                                   |

## Acceptance Criteria

1. Verification passes and the development server serves the application after the move.
2. No import, configuration entry, or current guidance references the old layout.
3. File history is preserved across the move.
4. Layer boundary enforcement still rejects a forbidden import under the new paths, including the new content-layer restriction.
5. No in-flight specification references a path that no longer exists.
