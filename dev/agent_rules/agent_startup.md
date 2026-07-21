# Meridian Idle Agent Startup

Read `dev/foundation/core/agent_rules/foundation_startup.md` and `dev/foundation/platforms/web-react/platform_startup.md` before this file. This is Meridian Idle's authoritative project-local startup layer.

## Project snapshot

- Product: maritime incremental / management game.
- Platform: Web React; TypeScript strict mode, semantic HTML, and CSS Modules.
- Persistence: IndexedDB through repository adapters.
- Primary build: Web/PWA through Vinext.
- Tests: Vitest and React Testing Library.

## Required operation contracts

- Read `dev/agent_rules/git_operations.md` before any Git mutation or when Git state is unreliable.
- Read `dev/agent_rules/test_operations.md` before any test, build, format check, browser validation, or other verification operation.

## Project-local discovery

- Use `dev/README.md` for Meridian's trigger map. It routes shared rules directly to `dev/foundation/` and project-specific deltas to the correct local document.
- Read `dev/standards/standards_enforcement.md` before changing local governance or `dev/tools/check-governance.mjs`.
- Read `dev/foundation/platforms/web-react/standards/project_structure_standard.md` and `dev/standards/project_structure.addendum.md` before changing Meridian's runtime folder layout.
- Read `dev/foundation/core/standards/runtime_ownership.md` (State Lifecycle Addendum) and `dev/skills/offline-time-resolution.md` for state classification and Meridian elapsed-time behavior.
- Product decisions live in `dev/docs/design/`; active planning lives in `dev/docs/plans/`; `TODO.md` owns forward work and `CHANGELOG.md` owns shipped history.

## Local defaults

- Use the existing npm lockfile and package manager; do not switch package managers.
- Prefer existing feature ownership over speculative abstractions.
- Write project-local communication and documentation in Traditional Chinese or English. Keep code identifiers, file paths, and command names in their actual spelling.
