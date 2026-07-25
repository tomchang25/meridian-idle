# Plain Vite SPA Migration

Parent Plan: none (standalone spec)

## Goal

Strip Meridian's build and deployment layer down to a plain Vite React single-page app, matching the sibling tickstrike-web shape. Remove the vinext/Next runtime, the Cloudflare Worker hosting scaffold, and the PWA service-worker surface, none of which the game depends on, so future work (debug hub, nautical chart) lands on the same simple placement and tooling as tickstrike.

## Summary

Today Meridian runs on `vinext` (a Vite plugin that emulates the Next.js App Router with RSC/SSR) plus a `@cloudflare/vite-plugin` worker, a `sites` build plugin, and a hand-written PWA service worker. None of this earns its keep: the only real Next coupling is a type-only `import type { Metadata }` in two files, `.openai/hosting.json` declares `d1: null, r2: null` (no database or storage was ever wired), `worker/index.ts` is the untouched vinext-starter template, and persistence is entirely browser-side IndexedDB. The app is a single `"use client"` composition root reading `?scenario=` from the URL — an SPA wearing a full-stack framework.

This change converts it to the tickstrike shape: a root `index.html` with a `#root` div and a `src/app/main.tsx` entry that mounts `GameSurface` through `createRoot`, backed by `@vitejs/plugin-react` (already a dependency). It deletes the Next route shell (`layout.tsx`, `page.tsx`, `next.config.ts`), the Cloudflare/worker/hosting scaffold (`worker/`, `.openai/`, `sites-vite-plugin.ts`, the cloudflare and sites plugins, `wrangler`), and the PWA surface (`public/sw.js`, `public/manifest.webmanifest`, `src/platform/pwa/`) because the product target is now desktop-only with a possible future Tauri shell, not an installable PWA. `vite.config.ts` collapses to a react plugin plus the `@` alias. `package.json` scripts move to plain `vite`/`vite build`/`vite preview`, and the removed dependencies (`next`, `vinext`, `@cloudflare/vite-plugin`, `wrangler`, `react-server-dom-webpack`, `@vitejs/plugin-rsc`, `eslint-config-next`) leave the tree.

Removing `next` forces one consequential retooling: `eslint.config.mjs` currently gets its base rules from `eslint-config-next`, which depends on `next`. The base preset is replaced with `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks`, while the project's custom layer-boundary `no-restricted-imports` blocks and the `eslint-config-prettier` tail are preserved unchanged. `npm run lint` keeps enforcing layer boundaries exactly as before; only the general-purpose base rule set shifts from the Next preset to the standard TS/React one.

Because vinext/RSC is gone, the `"use client"` directive is meaningless (every component is a client component in a plain SPA). The seven source files carrying it are cleaned, and `react_component.addendum.md` is rewritten from "RSC by default, add `"use client"` when needed" to "plain SPA, all components are client components." Governance prose that names Vinext, Cloudflare, the worker tree, or the PWA (`README.md`, `agent_startup.md`, `test_operations.md`, `project_structure.addendum.md`, `web_platform.addendum.md`) is corrected in the same change. The e2e suite already enters at `/` and `/?scenario=…`; with Option A (Playwright drives the Vite dev server) those URLs are unchanged, so no spec bodies move here — the `/debug/*` route relocation belongs to the later debug-hub work, not this migration.

The landed result: `npm run dev` is plain Vite, `npm run build` emits a static client bundle, `npm run verify` and the Playwright suite pass, the game plays identically, and no vinext/Next/Cloudflare/PWA reference remains outside historical `CHANGELOG.md` entries.

## Requirements

1. `npm run dev` serves the app through plain Vite with no vinext, Next, or Cloudflare process, and the game boots, provisions, departs, and arrives identically to today.
2. `npm run build` produces a static Vite client bundle with no SSR/RSC/worker output; `npm run verify` passes end to end with `vite build` as its build stage.
3. The `?scenario=` harness still loads authored worlds and publishes the debug interface at the root URL, and ordinary play stays unharnessed — the harness contract is behavior-preserving.
4. Layer-boundary enforcement via `npm run lint` still fails a forbidden cross-layer import; `npm run governance:check` passes with every local contract intact.
5. No service worker registers and no PWA manifest/install surface ships; the app runs as a plain desktop web page.
6. No source, config, dependency, or governance-prose reference to vinext, Next, Cloudflare Worker, wrangler, RSC, or the PWA remains, except historical `CHANGELOG.md` records.

## Relational Context

- `src/app/game-surface.tsx` is the real composition root and is preserved as-is (aside from dropping its now-inert `"use client"` line); the new `src/app/main.tsx` mounts it via `createRoot` and imports `./globals.css`. `layout.tsx` (metadata + PWA registration + `<html>/<body>`) and `page.tsx` (metadata + renders `GameSurface`) are deleted; their page-title/metadata role moves into `index.html`'s `<head>`.
- `index.html` at repo root is the new Vite entry and references `/src/app/main.tsx`; the `<title>` is `Meridian Idle`, and `<link rel="icon" href="/favicon.svg">` keeps the existing favicon. `public/favicon.svg` stays; `public/manifest.webmanifest` and `public/sw.js` are removed.
- The only Next import in the tree is `import type { Metadata }` in `layout.tsx` and `page.tsx`; both files are deleted, so nothing else needs a Next replacement. Confirm no other `from "next"` import survives.
- `vite.config.ts` currently wires `vinext()`, `sites()`, `cloudflare()`, `hostingConfig`, wrangler env vars, and a Codex-seatbelt watch tweak. All are removed; the file becomes `defineConfig` with `@vitejs/plugin-react` and the `@ -> ./src` alias only. The `@` alias must stay declared in all three of `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts` (per the structure addendum); `vitest.config.ts` needs no other change.
- `PwaRegistration` (`src/platform/pwa/pwa-registration.tsx`) is imported only by the deleted `layout.tsx`; removing the directory orphans nothing else. `pwa-registration` is the only reference to `/sw.js`.
- `eslint.config.mjs` sources base rules from `eslint-config-next` (which pulls `next`). Replace the base with `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks`, keep the custom per-layer `no-restricted-imports` blocks verbatim, and keep `eslint-config-prettier` last. Wrong shape to avoid: dropping or rewriting the boundary blocks — they are the project's only layer-boundary enforcement and the structure addendum couples them to this file. Trim `globalIgnores` of the now-absent `.next`/`.vinext` entries but keep `dist`, `coverage`, and `dev/foundation`.
- `dev/tools/check-governance.mjs` enforces literal token fragments: `web_platform.addendum.md` must contain `service worker`, and `react_component.addendum.md` must contain `"use client"`. Both docs must be reworded (PWA removed; RSC removed) while keeping those literal tokens present, or the checker fails. This is a load-bearing constraint on how those two files are edited, not a reason to leave stale guidance.
- `CHANGELOG.md` records the PWA shell as historically shipped; that entry is history and must not be rewritten. Removal earns its own new changelog entry at closeout, not an edit to the old line.
- `playwright.config.ts` runs `wrangler dev --local --port 3100` as its `webServer`. Under Option A it runs the Vite dev server instead (`npm run dev` on the same port); `baseURL` and the spec bodies are unchanged.
- `tsconfig.json` carries a `next` language-service plugin and `next-env.d.ts`/`.next/types` includes. Remove the plugin and the Next-specific includes; `src/vite-env.d.ts` already provides Vite client types. Delete `next-env.d.ts` if present.

## Scope

### Included

- Replace the Next route shell with `index.html` + `src/app/main.tsx`; delete `layout.tsx`, `page.tsx`, `next.config.ts`.
- Remove the Cloudflare/worker/hosting scaffold: `worker/`, `.openai/`, `dev/tools/sites-vite-plugin.ts`, and the cloudflare/sites/wrangler wiring in `vite.config.ts` and `package.json`.
- Remove the PWA surface: `public/sw.js`, `public/manifest.webmanifest`, `src/platform/pwa/`, and its registration.
- Simplify `vite.config.ts`, `package.json` scripts/deps, `tsconfig.json`, and `playwright.config.ts` to the plain-Vite shape.
- Replace the `eslint-config-next` base while preserving the custom boundary rules.
- Strip inert `"use client"` directives from the seven source files.
- Update governance/doc prose that names removed tooling, keeping the two literal checker tokens.

### Excluded

- The debug-hub route surface and any `/debug/*` path move (separate follow-on work).
- Tailwind/PostCSS tooling, unless a removal above orphans it (it does not; leave it).
- Any gameplay, content, formula, save-schema, or UI behavior change.
- Switching lint engines to oxlint or boundary enforcement to dependency-cruiser; ESLint stays.

## Files to Change

| File                                                                                                                                                                                                                        | Change Size | Purpose                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| `index.html`                                                                                                                                                                                                                | Small (new) | Vite HTML entry: title, favicon, `#root`, `main.tsx` script |
| `src/app/main.tsx`                                                                                                                                                                                                          | Small (new) | `createRoot` mount of `GameSurface`; imports `globals.css`  |
| `src/app/layout.tsx`                                                                                                                                                                                                        | Delete      | Next root layout, metadata, PWA registration                |
| `src/app/page.tsx`                                                                                                                                                                                                          | Delete      | Next home route                                             |
| `src/app/game-surface.tsx`                                                                                                                                                                                                  | Small       | Drop inert `"use client"`                                   |
| `next.config.ts`                                                                                                                                                                                                            | Delete      | Next config shell                                           |
| `vite.config.ts`                                                                                                                                                                                                            | Medium      | Collapse to react plugin + `@` alias                        |
| `package.json`                                                                                                                                                                                                              | Medium      | Plain-Vite scripts; remove/add dependencies                 |
| `tsconfig.json`                                                                                                                                                                                                             | Small       | Remove Next plugin and includes                             |
| `eslint.config.mjs`                                                                                                                                                                                                         | Medium      | Replace Next base, keep boundary blocks                     |
| `playwright.config.ts`                                                                                                                                                                                                      | Small       | Vite dev server as `webServer`                              |
| `worker/`, `.openai/`                                                                                                                                                                                                       | Delete      | Cloudflare worker + hosting scaffold                        |
| `dev/tools/sites-vite-plugin.ts`                                                                                                                                                                                            | Delete      | Hosting build plugin                                        |
| `public/sw.js`, `public/manifest.webmanifest`                                                                                                                                                                               | Delete      | PWA surface                                                 |
| `src/platform/pwa/`                                                                                                                                                                                                         | Delete      | Service-worker registration                                 |
| `src/ui/**`, `src/runtime/use-game-store.ts`                                                                                                                                                                                | Small       | Strip inert `"use client"` (6 files)                        |
| `README.md`, `dev/agent_rules/agent_startup.md`, `dev/agent_rules/test_operations.md`, `dev/standards/project_structure.addendum.md`, `dev/standards/web_platform.addendum.md`, `dev/standards/react_component.addendum.md` | Small       | Correct prose; keep the two literal checker tokens          |

## Execution Outline

1. Add `index.html` and `src/app/main.tsx`; delete `layout.tsx`, `page.tsx`, `next.config.ts`, and drop the `"use client"` line from `game-surface.tsx`. Verify the app renders through Vite (`npm run dev`).
2. Simplify `vite.config.ts` to react + alias; delete `worker/`, `.openai/`, and `sites-vite-plugin.ts`.
3. Remove the PWA surface (`public/sw.js`, `public/manifest.webmanifest`, `src/platform/pwa/`).
4. Rewrite `package.json` scripts (`dev`/`build`/`preview`/`test:e2e`/`verify`) and dependencies; run `npm install` to settle the lockfile.
5. Replace the `eslint.config.mjs` base preset, keeping the boundary blocks; strip the remaining six `"use client"` directives; clean `tsconfig.json` and delete `next-env.d.ts` if present.
6. Point `playwright.config.ts` at the Vite dev server.
7. Update governance/doc prose, preserving the `service worker` and `"use client"` literal tokens the checker requires.
8. Run the full verification contract (`npm run verify`) plus the Playwright acceptance suite against the Vite dev server; fix and rerun.

## Implementation Notes

- Keep `src/app/main.tsx` minimal: `createRoot(document.getElementById("root")!).render(<StrictMode><GameSurface /></StrictMode>)` — match tickstrike; StrictMode is optional but the runtime already tolerates double-invoke effects, so keeping it is safe.
- `game-surface.tsx`'s `useSyncExternalStore` SSR-guard comment about hydration mismatch is now moot under a client-only SPA, but the code is harmless; leave the logic and only remove the `"use client"` directive to keep the change tight.
- ESLint base: `@eslint/js` `configs.recommended`, `typescript-eslint` `configs.recommended`, and `eslint-plugin-react-hooks` `configs['recommended-latest']`, then the existing custom boundary objects, then `eslint-config-prettier/flat`. Expect a slightly different general rule set than the Next preset; fix any newly surfaced warnings rather than suppressing, since `--max-warnings=0` is the pass bar.
- `web_platform.addendum.md`: reword the PWA line to state no service worker / no PWA install surface ships (desktop target, possible future Tauri), keeping the literal `service worker`.
- `react_component.addendum.md`: rewrite the rendering-boundary decision to "plain Vite SPA — every component is a client component," and phrase the `"use client"` mention as obsolete/never-add so the literal token survives the checker.
- Pin the dev port if preserving `localhost:3000` muscle memory (`vite --port 3000`); Playwright keeps its own port.

## Edge Cases

| Case                                   | Expected Handling                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Checker token coupling                 | `web_platform.addendum.md` keeps `service worker`; `react_component.addendum.md` keeps `"use client"`, both reworded to negative guidance |
| Historical PWA changelog entry         | Left untouched; removal recorded as a new entry at closeout                                                                               |
| `next-env.d.ts` present                | Deleted and removed from `tsconfig.json` includes                                                                                         |
| ESLint base swap surfaces new warnings | Fixed to satisfy `--max-warnings=0`, not suppressed                                                                                       |

## Acceptance Criteria

1. `npm run dev` starts a plain Vite dev server with no vinext/Next/Cloudflare process, and the game boots, provisions, departs, and arrives exactly as before.
2. `npm run build` emits a static client bundle with no SSR/RSC/worker output, and `npm run verify` passes end to end.
3. The `?scenario=` harness loads authored worlds and exposes the debug interface at the root URL, and ordinary play remains unharnessed.
4. The Playwright acceptance suite passes against the Vite dev server.
5. No service worker registers and no PWA manifest or install surface ships.
6. A forbidden cross-layer import still fails `npm run lint`, and `npm run governance:check` passes with all local contracts intact.
7. No vinext, Next, Cloudflare Worker, wrangler, RSC, or PWA reference remains in source, config, dependencies, or governance prose, except historical `CHANGELOG.md` entries.
