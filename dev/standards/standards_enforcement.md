# Meridian Governance Enforcement

`dev/foundation/tools/verify_consumer.py` verifies the selected foundation layer and required project-local operation contracts. `dev/tools/check-governance.mjs` verifies Meridian-owned discovery, addenda, TODO pointers, and active plan shape. Neither validator replaces prose review.

## What is enforced

- `dev/foundation.config.json` selects the schema-2 Web React foundation with no profile.
- Meridian provides the required local startup, Git, and test operation contracts, and they point to their canonical foundation owners.
- Shared governance compatibility copies are absent; shared workflows, Web standards, agent rules, and skills are read from `dev/foundation/`.
- Meridian's README, local addenda, product-doc tracking, and package scripts point to discoverable owners.
- TODO, plan-pointer, child-parent, and active-main-plan integrity remain protected locally.
- `package.json` runs both foundation and Meridian governance verification before full application verification.

## What remains prose-reviewed

- Architecture and product decisions, including whether a proposed addendum is genuinely project-specific.
- Plan requirements, implementation-spec relational context, review depth, and closeout evidence.
- Whether a new local skill is a real Meridian-specific hazard rather than a duplicate foundation rule.

## Adding a machine-checkable rule

1. First assign the rule to its canonical owner using `dev/foundation/core/standards/governance_structure_standard.md`.
2. Add a local checker assertion only when the contract is Meridian-owned, has silent-loss risk, and can be judged accurately with low false positives.
3. Keep the human-readable rule in its canonical document; the checker is protection, not the sole source of truth.
4. Modify `dev/tools/check-governance.mjs` only for local contracts. Change foundation-wide rules upstream.
5. After changing the checker or package scripts, run `npm run governance:check` and `npm run verify`.

## Verification scope

- Docs-only or tracking-only change: run Prettier against changed Markdown files and `npm run governance:check`.
- Local checker or package-script change: run `npm run verify`.
- Program change: `npm run verify` runs governance, formatting, typecheck, lint, tests, and production build.
