# Nautical Chart and Passage Navigation

## Goal

Replace the static Known waters illustration and direct-route Harbor board with a nautical-chart departure surface backed by spatially meaningful navigation. The feature must preserve deterministic, offline-safe Voyage resolution and Port-based trade settlement while creating a durable foundation for SubRegion-scoped maritime missions that do not require artificial intermediate Port calls.

## Requirements

1. Known Ports appear at authored relative positions on one interactive nautical chart that identifies the current Port, Region and SubRegion context, Port Level, specialties, availability, and selected destination.
2. Navigation uses a sparse weighted graph of terminal Ports, harbor approaches, sea junctions, and chokepoints; an intermediate Port is never entered unless it is the committed destination, because passing nearby must not refresh its Market Session or trigger Port progression.
3. Region remains the economic and world-unlock scope, while SubRegion becomes the local maritime-content scope; neither is a routing node or fixed travel-cost bucket, because shared boundaries must not make unequal voyages cost the same.
4. Selecting a known reachable Port produces one deterministic fastest legal passage with a visible path, distance, duration, required Food and Water, static risk, traversed waters, and disabled reason before a separate departure confirmation.
5. Passage preview, departure validation, the persisted Voyage snapshot, foreground resolution, reload, and offline return use one route-estimation contract and one explicit-time resolver so presentation cannot invent a cheaper path or an alternate arrival.
6. Voyage advancement is elapsed-time-aware and boundary-driven rather than hourly-tick-driven: the engine may cross multiple path or event boundaries in one resolution call, while a quiet uninterrupted Voyage may still resolve directly to arrival.
7. The chart and its equivalent textual controls remain usable on desktop, mobile, keyboard, touch, reduced motion, and assistive technology without making color, pointer precision, or decorative geography the only source of route meaning.

## Design

### Delivery Boundary And Dependencies

This plan follows the V5 Core Voyage, Event, Combat, Port settlement, and Region-unlock work. It replaces the current direct Port-to-Port route content only after those deterministic and recovery contracts are available; it does not create a competing Voyage resolver or a second Market-entry path.

The first delivered chart converts the coherent Core world without requiring the final Mediterranean content volume. Later Ports, sea activities, and locked Regions extend the same navigation and content scopes rather than introducing another map model.

### World Layers

| Layer            | Behavioral responsibility                                                                              | Routing responsibility                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Region           | Economic classification, Specialty sale scope, world unlock, and broad chart grouping                  | Gates access to eligible content but contributes no fixed distance                                       |
| SubRegion        | Maritime narrative, weather or danger context, mission eligibility, encounters, and local chart labels | Annotates portions of a path but is never a path node                                                    |
| Port             | Docking, Market Session, trade, progression, repair, and provisioning                                  | Terminal destination connected to a nearby harbor approach                                               |
| Navigation point | Harbor approach, sea-lane junction, strait, headland, or other meaningful topology                     | Connects weighted directed edges and normally remains invisible to the player                            |
| Navigation edge  | Authored navigable water between two points                                                            | Owns distance, direction, chart geometry, traversal modifiers, static risk exposure, and SubRegion spans |
| Passage          | One quoted and then committed journey between Ports                                                    | Owns the ordered legal edge path and its aggregate player-facing cost                                    |

Region and SubRegion boundaries may be drawn as chart areas, while runtime traversal uses authored edge spans that state how much of an edge belongs to each SubRegion. This keeps maritime-content timing deterministic without requiring runtime polygon-intersection or treating a whole sea area as one equal-cost node.

### Sparse Navigation Graph

Navigation points exist only where they change connectivity or gameplay meaning. Extra coordinates used to draw a curved coast-following line are presentation geometry, not graph nodes and not additional persisted progress boundaries.

Every Port connects through its own terminal berth to a harbor-approach point. Through traffic may use the approach but cannot traverse the terminal berth, so a passage can cross Marseille's offshore approach without entering Marseille, refreshing its Market, or settling Port XP.

The default planner selects the legal path with the lowest estimated duration. Equal-duration candidates use total distance and then stable authored identity as deterministic tie-breakers. Locked Region edges, unavailable destinations, malformed edges, and paths with no legal connection are excluded rather than approximated through a Region center.

### Passage Estimation

Navigation distance is authoritative game content rather than screen-pixel distance. The shared estimator performs these operations once for preview and again against current canonical state at departure:

```text
Passage distance = sum(edge distance)
Unrounded edge duration = edge distance / Fleet speed × edge traversal modifier × time unit
Base passage duration = round-half-up(sum(unrounded edge duration))
Required Supply = ceil(base passage duration × Fleet consumption rate)
```

Fleet speed is canonical Fleet state, fixed at 100 until a later upgrade system moves it. Food and Water remain the mandatory committed Voyage Supplies; their rates and the time unit are content-owned constants, and required quantities derive from quoted duration through one shared formula. Supply quantities and acquisition cost basis remain consumed atomically at departure; later Event-driven delays or losses may consume additional Supplies through the existing ordered Event contract.

An approved balance decision (2026-07-25) re-authors the converted Core world rather than preserving legacy route quotes: edge distances are rebuilt on the graph, and normal-play durations are 20× the legacy debug-scale durations. A harness-owned debug time scale (`DEBUG_TIME_SCALE = 20`) keeps the legacy 2–5 second observed pacing for debug play and tests, without changing canonical durations or persisted state.

Each edge retains its own static risk exposure for deterministic Event resolution. The route-level preview may summarize independent edge exposure as `1 - product(1 - edge risk)`, but the immutable Voyage snapshot retains ordered edge inputs so arrival and Events never depend on mutable chart content.

### Boundary Example

Consider this illustrative topology:

```text
Montpellier Port
        |
Gulf of Lion West
        |
Marseille Approach ---- Marseille Port
        |
Ligurian West
        |
Genoa Approach -------- Genoa Port
```

Marseille to Genoa begins at Marseille Port and joins the shared eastbound path at Marseille Approach. Montpellier to Genoa first traverses its additional western edges, then shares the same offshore path without entering Marseille Port. Both passages can report Southern France and the Ligurian Sea as traversed SubRegions, but Montpellier retains its greater distance, duration, and Supply cost because those values come from edges rather than SubRegion transitions.

### Voyage Snapshot And Advancement

Departure persists an immutable passage snapshot containing origin, planned destination, ordered edges, copied edge timing and risk inputs, SubRegion spans, aggregate requirements, timestamps, and seed. Active Voyages do not recompute their path after content, unlocks, or balance data change.

Canonical advancement uses explicit timestamps. Presentation may interpolate the ship's position along the snapshot for a smooth chart display, but animation frames and timer counts do not mutate gameplay state. The shared resolver advances through every meaningful crossed boundary in chronological order:

```text
current resolved boundary
-> edge or SubRegion boundary
-> deterministic Event or decision boundary
-> next boundary
-> destination Port entry
```

If no intermediate effect exists, one call may cross the full path and settle arrival. If a manual decision is introduced by existing Event content, resolution stops at that decision and never chooses on the player's behalf. Only actual destination entry invokes Market Session transition, Port XP settlement, arrival restocking, and docked operations.

### Nautical Chart Flow

While docked, the chart is the Harbor departure workspace rather than a decorative sidebar panel:

1. The chart opens centered on the current Port and displays all known Ports at authored relative positions.
2. Selecting a Port reveals its Region, SubRegion, Level, specialties, known status, and route availability without generating remote Market state.
3. The planner highlights the complete offshore passage and presents distance, duration, Food, Water, risk, traversed waters, and any disabled reason.
4. A separate Set Sail command revalidates the same quote against current Fleet state and commits the immutable Voyage.
5. While underway, the same chart shows origin, destination, interpolated ship position, current narrated waters, remaining time, and any Event boundary.
6. Arrival changes the chart anchor and enables Port operations only after canonical settlement completes.

The former Known waters sidebar must not remain a competing map owner. It may become a compact legend or known-Port summary, but Port Level and specialty intelligence remain available from chart selection and an equivalent semantic list.

### Child Overview

| Child | Focus                                         | Observable outcome                                                                                                                            | Current document                                                                                      |
| ----- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 01    | Spatial Content, Planner, And Chart Inspector | The authored graph, deterministic planner, and shared estimator are visually verifiable through a `/debug/chart` inspector with quote preview | [Implementation spec](nautical-chart-navigation_01_spatial-navigation-content.implementation_spec.md) |
| 02    | Voyage Contract And Migration                 | Departure adopts the planner's quote into an immutable persisted Voyage without forced intermediate docking, migrating legacy route saves     | [Sketch](nautical-chart-navigation_02_passage-planning-and-voyage-contract.sketch.md)                 |
| 03    | Nautical Chart Departure Surface              | Known waters becomes an accessible chart for Port intelligence, route preview, and explicit departure                                         | [Sketch](nautical-chart-navigation_03_chart-departure-surface.sketch.md)                              |
| 04    | Boundary-Aware Progress And Hardening         | Underway location, SubRegion exposure, Event boundaries, persistence, and offline resolution remain deterministic across the complete path    | [Sketch](nautical-chart-navigation_04_boundary-aware-progress.sketch.md)                              |

Recommended landing order is 01, 02, 03, then 04. Child 01 carries the planner and estimator so its inspector can preview real passages; Child 02 is therefore the Voyage-contract child — departure validation, the immutable snapshot, and legacy-save migration. Child 03 depends on the planner rather than shipping a second presentation-only route model, and Child 04 hardens the complete chart-to-arrival flow after both planning and interaction exist.

## Non-Goals

1. Free-form ship steering, a continuous ocean physics simulation, runtime navmesh generation, or routing directly from screen pixels.
2. Automatic Trade Routes, multiple Fleets, background logistics, or player-authored waypoint sequences.
3. Dynamic weather, currents, Pirate Danger, Patrol, safest-route optimization, or risk-versus-speed route preferences.
4. Delivering pirate hunts, wreck searches, patrols, or other SubRegion missions; this plan provides their spatial and elapsed-time foundation only.
5. Final Mediterranean map coverage, final geographic scale, or final route and Supply balance beyond converting the coherent Core world.
6. Changing Region-based Specialty sale modifiers, Market Session lifecycle, Port progression, Combat rules, or Expedition completion semantics.

## Acceptance Criteria

1. Every known Port appears at a data-driven relative location, and selecting it exposes Level, specialties, Region, SubRegion, and reachability without creating remote Market state.
2. Marseille-versus-Montpellier-style boundary cases retain different route totals when their actual edge paths differ, even when both passages traverse the same ordered SubRegions.
3. A path may pass a Port's offshore approach without entering that Port; only the committed destination performs Market, progression, restock, and docked-operation transitions.
4. Equal canonical state and content always produce the same legal edge path, aggregate distance, duration, Supply requirements, risk summary, and disabled reason.
5. Departure revalidates and persists an immutable ordered passage snapshot, so later content or unlock changes cannot alter an active Voyage.
6. Foreground timers, reload, visibility resume, hydration, clock rollback, and long offline return use the same explicit-time resolver and produce the same ordered boundaries, costs, Events, and arrival exactly once.
7. Converted Core journeys follow the approved 2026-07-25 rebalance — re-authored edge distances, normal-play durations at 20× legacy scale from Fleet speed 100, formula-derived Supplies — with the pinned baseline table in the Child 01 spec as the parity authority, and destination-settlement behavior unchanged.
8. The chart replaces the static three-point, single-line illustration and direct per-route departure board as the authoritative destination command surface without leaving Port Level confined to a sidebar.
9. Docked selection, disabled routes, departure confirmation, underway progress, Event interruption, and arrival remain understandable and operable on desktop, mobile, keyboard, touch, reduced motion, and assistive technology.
10. Malformed graph content, unreachable known Ports, invalid persisted paths, and obsolete active Voyage payloads fail through explicit validation or recoverable migration rather than creating an arbitrary route or Port entry.
