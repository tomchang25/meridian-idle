# V5 Core 04 — Port Progression and Specialty Supply

Parent Plan: `v5-core.md`

## Implemented Contract

Port XP is persisted and its Level is derived from the ledger curve. Only a different-Port settlement reads the closing Session's signed net trades and persisted unmodified reference values. Destination Session creation derives finite local Specialty stock from Level: 0, 20, or 40 Units. Catalog purchase availability reads the resulting level; production classification always reads the entire authored catalog.

## Verification

Focused progression tests cover distinct-product basis, same-port no-op, and the Level 50 boundary.
