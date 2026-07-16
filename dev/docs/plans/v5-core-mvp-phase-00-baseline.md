# V5 Core MVP Phase 00 Baseline

Parent Plan: `v5-core-mvp-agent-experiment.md`

## Goal

Record the reproducible delivery baseline for the autonomous V5 Core MVP experiment before gameplay implementation begins.

## Requirements

1. Record the authorized branch, base revision, remote, worktree baseline, and available local automation capability.
2. Establish one reproducible CI path for intermediate phases and retain a browser-smoke path for final main-plan acceptance or an explicit user request.
3. Keep baseline records separate from the V5 product-design authority and from unrelated user worktree changes.

## Design

This plan captures the delivery baseline for the autonomous V5 Core MVP experiment. It is a trace record for the active experiment, not a second product-requirements owner.

## Invocation

| Field                         | Recorded value                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Branch                        | `feat/v5-core-mvp`                                                                |
| User-designated base revision | `cc96ca0d679f0c69e18799e402c376488f489e6b`                                        |
| Remote                        | `origin` → `https://github.com/tomchang25/meridian-idle.git`                      |
| Git authority                 | Create/switch branch, stage owned files, commit, push to `origin`, and inspect CI |
| Browser authority             | Install browser-smoke dependencies and browser executable                         |

## Worktree Baseline

- `dev/docs/plans/v5-core-mvp-agent-experiment.md` was already staged before implementation and remains outside the agent-owned Phase 00 commit scope.
- `.vscode/settings.json` was untracked before implementation and remains outside the agent-owned Phase 00 commit scope.
- The repository already had `node_modules/`; the global `npm` shim was unavailable, while `corepack npm 11.6.2` was available and is the package runner for this experiment.

## Automation Baseline

- Phase 00 retains one Playwright Chromium smoke suite for final main-plan acceptance or an explicit user request. It starts the production-equivalent application server and fails non-zero on an unavailable or unbootable application.
- Intermediate phases do not run local browser smoke or install browser dependencies in CI. They use focused unit tests, `npm run verify`, and the normal remote CI workflow.
- CI checks out submodules recursively, installs locked dependencies, and runs `npm run verify`.
- Browser reports and traces are available only when final-acceptance smoke is explicitly invoked. The suite may then cover the completed player journey without making intermediate phases wait on browser automation.

## Manual-Only Baseline

Phase 00 automation does not prove assistive-technology output, visual appearance at responsive breakpoints, touch target sizing, reduced-motion presentation, service-worker lifecycle, or PWA installability. Each phase must report the manual-only boundaries still not covered by its automation.

## Non-Goals

1. Implementing V5 gameplay, migration, cargo, market, progression, voyage, Events, Items, Combat, Repair, or Expedition behavior.
2. Replacing manual review for boundaries that browser automation cannot prove.
3. Modifying or committing user-owned staged and untracked baseline changes.

## Acceptance Criteria

1. The branch base, remote, authority, and pre-existing worktree changes are durably recorded.
2. A reproducible browser-smoke command remains available for final acceptance, without becoming an intermediate delivery gate.
3. CI initializes submodules, installs locked dependencies, and fails for repository verification failure.
4. Manual-only verification boundaries are explicitly recorded for later Phase reports.
