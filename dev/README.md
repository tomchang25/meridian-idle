# Meridian Development Governance

Meridian Idle is a `game-devkit` consumer. Shared governance is pinned as the `dev/foundation/` submodule at one exact commit; do not edit it from this repository or recreate its rules locally.

## Load order

1. Repository root `AGENTS.md`.
2. `foundation/core/agent_rules/foundation_startup.md`.
3. `foundation/platforms/web-react/platform_startup.md` selected by `foundation.config.json`.
4. `agent_rules/agent_startup.md` for Meridian's snapshot, operations, and local discovery.

The foundation owns placement, core workflows, shared agent behavior, persistence ownership, Web React standards, and portable skills. `dev/foundation.config.json` selects `web-react` with no architecture profile.

## Meridian-local ownership

- `agent_rules/`: project snapshot, Git permissions, and executable validation operations.
- `standards/`: Meridian folder layout, state model, project-specific Web/React/persistence addenda, and local checker policy.
- `skills/`: only Meridian-specific hazard cards.
- `docs/`: product design, active plans, archived work, and tracking navigation.
- `tools/`: Meridian-owned validators.

## Local trigger map

| Work                                                                                             | Required reading                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add, move, or reorganize files                                                                   | `foundation/core/standards/governance_structure_standard.md`, `foundation/platforms/web-react/standards/project_structure_standard.md`, `foundation/platforms/web-react/standards/naming_conventions.md`, `standards/project_structure.addendum.md`                                               |
| Add or rename npm scripts, change verification stages, or change formatter configuration         | `foundation/platforms/web-react/standards/command_surface_standard.md`, `standards/project_structure.addendum.md`                                                                                                                                                                                 |
| Change persisted state, command, selector, or runtime owner                                      | `foundation/core/standards/runtime_ownership.md`, `standards/state_management.md`                                                                                                                                                                                                                 |
| Change a React component, hook, effect, or responsive UI                                         | `foundation/platforms/web-react/standards/react_component_standard.md`, `standards/react_component.addendum.md`, `foundation/platforms/web-react/standards/web_accessibility_standard.md`; effect work also reads `foundation/platforms/web-react/skills/react-strict-mode-effects.md`            |
| Change IndexedDB, save schema, or migration                                                      | `foundation/core/standards/persistence_standard.md`, `foundation/platforms/web-react/standards/browser_persistence_standard.md`, `foundation/core/agent_rules/save_migrations.md`, `foundation/platforms/web-react/skills/indexeddb-upgrade-transactions.md`, `standards/persistence.addendum.md` |
| Change offline or elapsed-time resolution                                                        | `standards/state_management.md`, `skills/offline-time-resolution.md`                                                                                                                                                                                                                              |
| Change PWA, service worker, cache, or browser API                                                | `foundation/platforms/web-react/standards/web_platform_standard.md`, `standards/web_platform.addendum.md`; cache work also reads `foundation/platforms/web-react/skills/service-worker-cache-versioning.md`                                                                                       |
| Create or update a probe, plan, sketch, implementation spec, review, closeout, or command output | `foundation/core/workflows/work_lifecycle.md` and the matching file under `foundation/core/workflows/` or `foundation/core/workflows/commands/`; tracking work also reads `docs/README.md`                                                                                                        |
| Run validation or deliver a change                                                               | `agent_rules/test_operations.md` and `foundation/platforms/web-react/standards/testing_standard.md`                                                                                                                                                                                               |
| Any Git mutation                                                                                 | `agent_rules/git_operations.md`                                                                                                                                                                                                                                                                   |
| Change local governance or its checker                                                           | `foundation/core/standards/governance_structure_standard.md`, `standards/standards_enforcement.md`, `agent_rules/test_operations.md`                                                                                                                                                              |
