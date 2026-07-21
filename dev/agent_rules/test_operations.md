# Test Operations

This file is Meridian Idle's authoritative project-local test and Web React validation contract. Every agent-run format check, governance check, typecheck, lint, test, build, browser validation, or accessibility validation follows this file.

## When to run

Use the narrowest available layer that proves the changed behavior. Read the selected Web React standards first, then use the concrete commands below. Governance, package-script, build, or runtime changes require the full verification suite.

Documentation-only, TODO-only, plan-only, or local-governance prose changes require the changed Markdown Prettier check and `npm run governance:check`. They do not require application typechecking, tests, or production build unless they also change package scripts, the local checker, or build behavior.

## Browser smoke policy

Do not run a local browser smoke check during an intermediate implementation Child or phase. Browser smoke is reserved for final acceptance of the applicable main plan, or for a user request that explicitly names browser smoke. Intermediate work uses focused unit tests, `npm run verify` where required, and the normal remote CI workflow only.

## Environment and preparation

- Run commands from the repository root with npm 11.6.2 and Node.js 22.13.0 or later, as declared in `package.json`.
- Use the checked-in `package-lock.json`; do not switch package managers or rewrite the lockfile.
- Prefer `npm`. If the environment's npm shim cannot locate the pinned CLI, run the same command through `corepack npm` without changing the lockfile.
- `dev/foundation/` must be initialized at the commit pinned by the repository before governance validation. Run `git submodule update --init --recursive` only when the user has authorized the required Git mutation.
- Commands validate the current working tree. Report any distinction between staged and unstaged content when it affects the result.

## Available layers

| Layer                     | Command                    | Pass criteria                                                                                                    |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Foundation consumer shape | `npm run foundation:check` | `verify_consumer.py` reports `foundation: OK (web-react; no profiles)`.                                          |
| Local governance          | `npm run governance:check` | Foundation consumer verification and `dev/tools/check-governance.mjs` both succeed.                              |
| Formatting                | `npm run format:check`     | Prettier reports no formatting changes. For docs-only work, run `npx prettier --check <changed Markdown files>`. |
| Type safety               | `npm run typecheck`        | TypeScript exits successfully with no diagnostics.                                                               |
| Lint                      | `npm run lint`             | ESLint exits successfully with zero warnings.                                                                    |
| Automated tests           | `npm run test`             | Vitest exits successfully with all tests passing.                                                                |
| Production build          | `npm run build`            | Vinext production build exits successfully.                                                                      |
| Full verification         | `npm run verify`           | Governance, formatting, typecheck, lint, tests, and production build all pass.                                   |

## Manual-only boundaries

Browser acceptance tests live in `test/e2e/` and run through `npm run test:smoke` (production build plus Playwright); the browser smoke policy above governs when they run. No automated visual-regression, installability, service-worker lifecycle, or screen-reader suite is currently configured. For changes that affect those boundaries, report the manual browser, responsive, keyboard, reduced-motion, PWA, or assistive-technology verification still required.

## Result reporting

Report every layer actually run, the source state it covered, pass/fail outcome, expected noise that affected interpretation, and every unrun manual-only or environment-limited boundary.
