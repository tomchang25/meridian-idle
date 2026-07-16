# V5 Core MVP Autonomous Agent Experiment

Parent Plan: `v5-core.md`

## Goal

Measure whether one autonomous agent can deliver the V5 Core MVP through Child 01 to Child 05 without manual implementation, Git, verification, or CI intervention. The experiment requires traceable phase boundaries and reproducible verification so a successful run can be evaluated as a candidate for a reusable workflow rather than as an unrepeatable one-off.

## Requirements

1. The experiment implements only Child 01 through Child 05: bootstrap and migration, product cargo and provisioning, manual market trade, port progression and specialty supply, and deterministic voyage with offline arrival.
2. The experiment begins from a user-designated base revision on one dedicated branch named `feat/v5-core-mvp`, unless that branch name already exists and the user explicitly selects a different name.
3. The agent may create, switch, stage, commit, push, and inspect CI only when the user explicitly invokes this experiment and grants those Git and remote mutations for that invocation; this document does not grant standing permission for later work.
4. Every phase must end on one or more logical commits. Each commit uses Conventional Commits and an outcome-focused message produced from the staged diff according to the commit-message workflow.
5. A later phase may not begin until the preceding phase's final commit passes the required local verification, automated browser smoke check, and remote CI check.
6. The agent must preserve unrelated worktree changes, never stage them, and never amend, rebase, force-push, reset, or otherwise rewrite history during the experiment.
7. Before gameplay implementation, the agent records the initial content and deterministic decisions that the MVP plans leave open. This ledger becomes the approved MVP content contract for the experiment so later phases do not silently change economy or resolution meaning.

## Design

### Invocation And Preconditions

The user starts the experiment with an explicit authorization that names the base revision and permits branch creation or switching, staging, commits, push to the selected remote, and CI inspection. The agent first records the branch, base revision, remote availability, credentials, existing worktree changes, and available browser automation capability.

The experiment is blocked, rather than partially simulated, when it cannot create or select the dedicated branch, push to the selected remote, observe CI, or run the required browser smoke checks. Pre-existing unrelated changes remain untouched and are reported as baseline context.

### Phase Order

| Phase | Scope                                      | Required outcome before the next phase                                                                                                 |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 00    | Automation baseline and MVP content ledger | CI executes repository verification and browser smoke checks; all initial content and deterministic choices are durable and reviewable |
| 01    | V5 bootstrap and migration                 | New, migrated, corrupt, absent, and unavailable-save states meet Child 01 acceptance criteria                                          |
| 02    | Product, cargo, and provisioning           | Authored catalog, shared cargo capacity, supply transactions, and persisted cost basis meet Child 02 acceptance criteria               |
| 03    | Market session and manual trade            | Persisted pricing, atomic buy and sell, price classification, and sale accounting meet Child 03 acceptance criteria                    |
| 04    | Port progression and specialty supply      | Different-Port settlement, level-derived unlocks, and finite specialty supply meet Child 04 acceptance criteria                        |
| 05    | Voyage and offline arrival                 | One deterministic foreground, resume, reload, and offline arrival path meets Child 05 acceptance criteria                              |

Before implementing each Child, the agent creates the required live-code-verified implementation spec. The spec replaces that Child's sketch as the parent plan's single executable handoff. Each Child's closeout is part of its Phase and completes before that Phase's terminal verification gate. This experiment adds delivery gates but does not replace planning, verification, or closeout ownership.

### Phase 00 Baseline

Phase 00 establishes a CI workflow that checks out required submodules, installs the locked dependencies, and runs `npm run verify`. It also establishes a reproducible automated browser smoke mechanism suitable for local execution and CI. The browser smoke mechanism must start the application or its production-equivalent server, exercise the currently available boot path, and return a non-zero status on failure.

The MVP content ledger fixes at least these decisions before Child 01 implementation:

- Initial Fleet location, Gold, Cargo Capacity, HP, Attack, and starting inventory.
- Regions, Ports, Products, Product Families, Categories, Supplies, Port catalogs, unlock tiers, base prices, and supply prices.
- Routes, travel duration inputs, Food and Water requirements, and static risk values.
- Port XP threshold curve and all values necessary to demonstrate the required trade and progression loop.
- Pseudorandom generator algorithm, seed generation rule, factor sampling rule, time unit, and round-half-up examples.

The ledger may choose a deliberately small coherent world, but it must satisfy the parent plan's minimum dataset requirements and leave no decision that would change observable MVP behavior to a later phase.

### Commit Discipline

Before every commit, the agent inspects only the intended staged diff, identifies whether it represents one logical outcome, and either splits unrelated staged work or removes it from the staging area. The agent then produces and uses a Conventional Commit message in this form:

```text
type(scope): concise outcome

- Durable outcome one
- Durable outcome two
```

The subject and optional body describe delivered behavior or durable rules, not commands, test execution, planning bookkeeping, or a list of edited files. A phase may contain multiple commits when that preserves independently reviewable outcomes, but commits must not be split artificially to inflate the count.

### Verification Gate

The final commit of every phase is eligible to close that phase only after all of these conditions hold:

1. The Child's acceptance criteria are implemented, with focused tests covering its domain, application, persistence, and rendered behavior where applicable.
2. `npm run verify` passes against the final phase state.
3. The automated browser smoke check passes against the final phase state and covers the phase's newly available player path.
4. The final phase state is pushed without rewriting history, and the corresponding CI run passes.
5. The agent reports every required manual-only boundary that automation cannot prove, including assistive technology, reduced motion, and visual review where applicable.

If local verification, browser smoke, push, or CI fails, the agent remains in the current phase, diagnoses and fixes the failure, then repeats every affected check. It must not begin a later phase after a failed, missing, or unobservable gate.

### Browser Smoke Journeys

The automated browser suite grows with the completed phases. At minimum, it proves application boot in Phase 00, save state selection and recovery rendering in Phase 01, provisioning in Phase 02, product buy and sell in Phase 03, different-Port settlement in Phase 04, and departure plus eventual arrival in Phase 05. The Phase 05 journey must also prove that a persisted in-progress Voyage resolves consistently after reload or elapsed time.

### Failure And Stop Conditions

The agent stops and reports the blocker instead of making speculative changes when product requirements conflict, required credentials or browser capability are unavailable, content cannot satisfy a parent-plan invariant, a migration compatibility decision lacks a supported input, or the current codebase contradicts an approved behavior in a way that changes scope or compatibility.

## Non-Goals

1. Child 06 through Child 08, including sailing events, Items, Combat, Repair, Expedition, and full cross-system hardening.
2. Treating a local `npm run verify` pass as a substitute for CI, or treating CI as a substitute for browser interaction verification.
3. Bypassing the existing implementation-spec, verification, and closeout lifecycle.
4. Promoting this experiment to shared governance before its results show which rules are genuinely reusable across projects.
5. Altering unrelated product behavior, existing history, remote configuration, package-manager format, or unowned worktree changes.

## Acceptance Criteria

1. A dedicated branch contains Phase 00 through Phase 05 in order, with at least one logical Conventional Commit per phase and no rewritten history.
2. Every phase's terminal revision has a recorded passing local `npm run verify`, automated browser smoke result, and CI run before the next phase begins.
3. The CI workflow reliably initializes required submodules and fails when repository verification or browser smoke checks fail.
4. The committed MVP content ledger supplies all data and deterministic choices needed for Child 01 through Child 05 without incompatible later-phase assumptions.
5. The delivered branch satisfies the parent plan's Child 01 through Child 05 acceptance criteria, while Child 06 through Child 08 remain absent from the playable runtime.
6. The experiment record identifies any manual-only verification gaps and any stop condition encountered, rather than representing unverified behavior as complete.
7. After a successful run, the experiment can be reviewed for promotion by extracting only cross-project, toolchain-neutral rules into shared workflow governance and retaining repository-specific commands and permissions locally.
