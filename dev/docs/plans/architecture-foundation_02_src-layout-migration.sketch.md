# Architecture Foundation 02 — Src Layout Migration Sketch

Parent Plan: `architecture-foundation.md`

## Goal

Explore the pure-move migration from the current root-level `app/` + `game/` layout to a unified `src/` layout whose layer names match tickstrike-web, so both repositories share one placement vocabulary and one set of boundary rules.

## Summary

This is a rename-only child: `git mv` plus configuration and documentation updates, zero logic change, landed as one commit. The favored direction maps each existing layer to its shared-taxonomy name rather than copying tickstrike-web's directory list verbatim; server and deployment directories stay at the repository root because they are not game code. vinext documents App Router detection in both `app/` and `src/app/`, but the spec author must verify this against the installed vinext version by actually running the dev server after the move — vinext is pre-1.0 and moving fast.

The single biggest mechanical consequence: the `@/*` alias currently maps to the repository root, so every internal import says `@/game/domain/...`. Remapping `@/*` to `./src/*` shortens every import and is a repo-wide mechanical rewrite in the same commit.

Timing gate from the parent plan: land only after the in-flight `feat/v5-core-mvp` and market batch-trade branches merge, and before canvas work multiplies file count.

## Sketch

Candidate directory mapping (verify nothing new appeared at spec time):

| Current | Target | Note |
| ------- | ------ | ---- |
| `app/` | `src/app/` | vinext App Router; verify detection with a real dev-server run |
| `game/domain/` (rules, models, state) | `src/core/` | matches tickstrike `src/core` |
| `game/domain/content/` | `src/content/` | pure move here; splitting/validation is child 04 |
| `game/application/` | `src/runtime/` | future home of the child-07 runtime |
| `game/infrastructure/` | `src/platform/` | IndexedDB, PWA, crypto adapters |
| `game/features/` | `src/ui/` | DOM feature UI |
| `worker/`, `db/`, `drizzle/` | unchanged at root | deployment/server concerns, not game layers |

- Do not create empty directories for absent layers: `game/shared/` does not exist on disk, and `src/presentation/` plus `src/harness/` are born in children 08 and 06 respectively.
- After the move, `src/content` importing `src/core` contracts is the expected dependency direction (content → core); the child-01 ESLint blocks must be re-scoped to the new paths in the same commit, with a new `content` element allowed to import core only.
- Likely configuration touchpoints, all in the same commit: `tsconfig.json` (`paths` remap `@/*` → `./src/*`; `include` globs likely survive as `**/*.ts`), `eslint.config.mjs` (both `files` globs and restricted alias patterns from child 01), `vitest.config.ts` and `playwright.config.ts` (verify whether any include/testDir glob mentions `game/` or `app/`), `.prettierignore`, and `.vscode/` tasks if any reference paths.
- Repo-wide import rewrite: `@/game/domain/` → `@/core/`, `@/game/domain/content/` → `@/content/`, `@/game/application/` → `@/runtime/`, `@/game/infrastructure/` → `@/platform/`, `@/game/features/` → `@/ui/`. Order the rewrite content-before-domain so the longer prefix wins. Feature-internal relative imports move with their files untouched.
- `tests/` and `e2e/` stay where they are; only their imports change. Verify whether any test reaches into `app/` by path.
- Documentation owners updated in the same commit: `dev/standards/project_structure.md` (rewrite the top-level ownership table and placement test; also retire the Godot-era prohibition context), `README.md` Structure section, and `dev/docs/README.md` if it names paths.
- Use `git mv` so history follows; verify afterwards with `git log --follow` on one file per layer.
- Verification for the whole child: `npm run verify` plus a manual `npm run dev` boot to confirm vinext resolves `src/app`, since no automated test covers dev-server route detection.
- Risk to inspect at spec time: any hardcoded `game/` or `app/` string outside imports — candidate spots are the service worker registration path, `next.config.ts`, `wrangler`/worker config, and the governance checker `dev/tools/check-governance.mjs`.

### Candidate files to inspect

- `tsconfig.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `playwright.config.ts`
- `next.config.ts`
- `dev/tools/check-governance.mjs`
- `dev/standards/project_structure.md`
- `README.md`

## Non-Goals

1. No content splitting or catalog validation (child 04).
2. No creation of `src/presentation/` or `src/harness/` ahead of their owning children.
3. No changes to `worker/`, `db/`, or `drizzle/` beyond verifying nothing in them hardcodes moved paths.
4. No behavior, formula, or dependency changes of any kind.

## Acceptance Criteria

1. After the migration, verification and the development server both pass, and no import or configuration references the old layout.
2. File history is preserved across the move.
3. The structure standard and README describe the new layout in the same change, and the old layout appears nowhere as current guidance.
