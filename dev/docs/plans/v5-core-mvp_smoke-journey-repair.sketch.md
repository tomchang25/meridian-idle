# V5 Core MVP Smoke Journey Repair Sketch

Parent Plan: `v5-core-mvp-agent-experiment.md`

## Goal

Explore replacement of the misleading one-path Playwright test with a truthful final-acceptance browser suite for the implemented Child 01–05 boundary. This subsection owns browser behavior only after correctness repair and HUD recovery have stabilized the player surface.

## Summary

The current smoke title claims trade but only buys Food and Water, departs, and waits for Faro. The repaired suite should prove the smallest set of production-equivalent journeys that distinguish application boot, recovery, Product trade, different-Port settlement, and deterministic persisted Voyage behavior.

The later spec should avoid one giant timing-sensitive scenario. Seed, clock, and IndexedDB setup need deterministic browser-facing seams or fixtures so reload and offline arrival do not depend on arbitrary sleeps. Final smoke execution remains a separate final-validation session, as requested.

## Sketch

- The later spec should inspect whether a test-only browser capability injection, IndexedDB fixture helper, or authored save envelope is the narrowest way to reach migration, corrupt-save, progression, Specialty, and mid-Voyage states. Fixtures must enter through real persistence or application boundaries rather than DOM mutation.
- A likely suite separates recovery, docked trade, and persisted Voyage journeys so one failure does not erase all diagnostic value.
- The trade journey must execute and assert at least one Product Buy and one Product Sell, including visible Gold, Cargo, cost basis or profit feedback, and stable Market Session pricing.
- The Port transition journey should assert source settlement and destination Session identity rather than only a changed heading.
- The Voyage journey should persist an in-progress operation, reload the page, advance beyond the arrival boundary deterministically, and assert exactly one destination transition and Result.
- Arbitrary `waitForTimeout` calls should be replaced by observable state or controlled time wherever practical.
- The final session should run repository verification first, then the complete Playwright suite once the production-equivalent server is healthy; intermediate implementation sessions need only focused browser work explicitly named by the user.
- Candidate files to inspect:
  - `e2e/application.smoke.spec.ts`
  - `playwright.config.ts`
  - `package.json`
  - `.github/workflows/verify.yml`
  - `game/application/use-game-store.ts`
  - `game/infrastructure/persistence/`
  - browser reports and traces from the prior failed experiment

## Non-Goals

1. Reintroducing per-commit or intermediate-phase smoke gates without a new explicit product decision.
2. HUD redesign, domain-rule repair, or changing production behavior solely to make selectors easier.
3. Visual-regression baselines, screen-reader automation, PWA installability, or service-worker lifecycle coverage.
4. Child 06–08 gameplay journeys.

## Acceptance Criteria

1. Every Playwright test name matches its actual assertions and no test claims Product trade without buying and selling a Product.
2. Production-equivalent browser journeys prove recovery, provisioning, Product trade, different-Port settlement, persisted mid-Voyage reload, and one offline arrival.
3. Seed, time, and persistence setup are deterministic, bounded, and use owned application or repository seams rather than arbitrary sleeps or DOM mutation.
4. Failures retain useful trace and screenshot evidence, while successful reruns do not depend on stale local browser or server state.
5. A separate final-validation session records passing repository verification and the complete smoke suite, with remaining manual visual and assistive-technology boundaries reported.
