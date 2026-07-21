# Nautical Chart Navigation 01 — Spatial Navigation Content Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore the authored spatial content needed to replace direct Port-to-Port route records with a sparse, validated navigation graph. This child establishes Region and SubRegion scope, Port positions, terminal harbor connections, weighted sea edges, and chart geometry without yet changing Voyage execution or the Harbor UI.

## Summary

The current content owner stores three Ports with Region strings and six directed routes whose distance, duration, risk, and Supplies are complete journey totals. The likely replacement keeps Ports as trade and settlement destinations, adds explicit Region and SubRegion records, and introduces hidden navigation points plus directed edges whose weights can be composed by the later passage planner.

Chart coordinates and edge drawing geometry should remain authored presentation metadata, while edge distance and traversal metadata remain authoritative domain content. Existing route identities must remain available until Child 02 migrates persisted active Voyages.

## Sketch

- `game/domain/content/core-content.ts` currently owns Product, Port, and Route records together. Verify whether the first graph remains cohesive there or whether navigation content has become large enough for a focused domain-content module without introducing a generic data framework.
- `Port` currently has only identity, name, Region string, and catalog. The candidate contract adds a chart position, SubRegion membership, and harbor-approach identity while preserving Region membership used by Specialty pricing.
- Candidate Region content should own stable identity, display name, unlock classification, and chart presentation metadata. Candidate SubRegion content should own parent Region, display name, chart boundary or label metadata, and maritime-content tags without becoming persisted world progress by default.
- Candidate navigation points should distinguish harbor approaches, open-sea junctions, straits, and headlands. Port berths remain terminal connections so graph traversal cannot accidentally settle an intermediate Port.
- Candidate directed edges should own stable identity, endpoints, authoritative distance, chart polyline geometry, static risk exposure, traversal availability, and ordered SubRegion spans. Bidirectional travel may share authoring helpers but must still produce explicit directional behavior when risk, currents, unlocks, or geometry differ.
- Use only topology-changing points. A curved polyline may contain many render coordinates without producing extra pathfinding nodes or persisted resolution boundaries.
- Graph validation should reject duplicate identities, unknown endpoints, invalid or non-positive distance, malformed geometry, invalid risk, impossible SubRegion spans, Port terminals with no approach, unintended berth-to-berth transit, and open known Ports with no legal graph path.
- The current Lisbon, Faro, and Tangier world should be converted without changing its approved journey totals. Verify the exact edge decomposition and balancing at spec time rather than deriving distance from current CSS marker positions.
- Existing `Route` records and their IDs are persisted by active Voyages. Do not remove or reinterpret them in this child before Child 02 defines the payload transition and deterministic fallback.

### Candidate files to inspect

- `game/domain/content/core-content.ts`
- `game/domain/models/game.ts`
- `game/domain/state/initial-game-state.ts`
- `game/domain/rules/market.ts`
- `game/domain/rules/voyage.ts`
- `game/infrastructure/persistence/save-migrations.ts`
- `test/unit/content.test.ts`
- `test/unit/market.test.ts`
- `test/unit/voyage.test.ts`
- `dev/docs/design/meridian-idle_v5_core_mvp_content_ledger.md`

## Non-Goals

1. Pathfinding, passage quoting, departure, active-Voyage migration, or arrival resolution.
2. Chart rendering, destination selection, responsive layout, or accessibility interaction.
3. Runtime polygon intersection, free-form steering, navmesh generation, or pixel-derived distance.
4. Dynamic weather, currents, Pirate Danger, Patrol, or actual SubRegion mission content.

## Acceptance Criteria

1. Region, SubRegion, Port, navigation point, and directed edge content have stable non-overlapping responsibilities and preserve existing Region-based Specialty semantics.
2. Ports are terminal docking destinations connected through harbor approaches, so the graph can pass near a Port without entering it.
3. Edge distance and SubRegion spans can distinguish unequal journeys that cross the same Region or SubRegion sequence.
4. The converted Core world has valid chart positions, legal directed connectivity, and no route balance change.
5. Invalid graph identities, endpoints, weights, spans, terminal topology, or required connectivity produce explicit content-validation failures.
