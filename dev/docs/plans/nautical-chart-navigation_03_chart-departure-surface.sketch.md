# Nautical Chart Navigation 03 — Chart Departure Surface Sketch

Parent Plan: `nautical-chart-navigation.md`

## Goal

Explore the replacement of the static Known waters illustration and direct-route Harbor cards with one accessible nautical-chart command surface. The child should make relative Port geography, specialties, Level, route narrative, costs, and explicit departure available without duplicating domain pathfinding or remote Market authority in presentation.

## Summary

The current Known waters drawing hard-codes Lisbon, Faro, Tangier, and one dotted line in CSS, while the adjacent dynamic list owns only Port names and Levels. `HarborPanel` independently filters direct route records and places a departure button on every card, so there is no selected destination or complete route preview.

The likely replacement uses a data-driven vector chart inside the docked Harbor workspace. Port selection remains transient UI state, passage data comes from domain selectors, and Set Sail is a separate confirmation command. A semantic Port list and route summary provide equivalent keyboard, touch, mobile, and assistive-technology operation rather than treating the visual map as the only control.

## Sketch

- `LongTermSidebar` currently owns the decorative Known waters map and the only all-known-Port Level list. The candidate UI should remove that competing map owner; the sidebar may retain a compact legend or status summary only when it adds information not already owned by the chart.
- `HarborPanel` currently renders every outgoing direct route with an immediate departure button. The candidate Harbor workspace should own destination selection, selected-Port intelligence, route preview, disabled reason, and one explicit Set Sail action.
- Candidate chart layers are coastline or parchment background, Region and SubRegion areas, legal sea-lane context, known Port markers, mission markers when later available, selected passage, current Fleet marker, labels, and interaction overlays. Hidden navigation nodes remain invisible outside an explicit development diagnostic.
- SVG is a likely first rendering boundary because the current world is authored and modest, path geometry is vector data, and semantic controls can remain in ordinary DOM alongside it. Verify rendering and performance assumptions at implementation-spec time rather than introducing a general mapping library by default.
- Selecting a known Port should expose name, Region, SubRegion, Level, full authored catalog or concise specialty summary, observed Market-information status, reachability, distance, duration, Food, Water, risk, and traversed waters. It must not create or refresh a remote Market Session.
- The current Port needs a distinct non-color-only marker, and the selected destination and passage need persistent labels or text equivalents. Unknown or locked content must follow the established world-discovery rules rather than leaking final Port identities through chart geometry.
- Selection, zoom or pan if needed, and open detail state are presentation state and should not enter the game save. The committed Voyage snapshot remains the only persisted journey owner.
- Keyboard interaction should offer a predictable Port list or roving marker model, visible focus, activation without pointer precision, and preserved context after a failed departure. Touch targets and detail placement must remain usable at current mobile breakpoints.
- The visual chart may be hidden from assistive technology only if the equivalent semantic controls expose current location, available destinations, relative route narrative, selected path, costs, risk, and disabled reason. A bare Port-name list is not equivalent.
- Reduced motion should disable decorative route drawing and ship animation without hiding static progress or route state.
- Component tests should assert Port intelligence, selection-versus-departure separation, route-preview parity, disabled descriptions, no remote Market mutation, keyboard flow, semantic chart alternative, and underway handoff. Final-plan browser acceptance should inspect desktop, mobile, touch, focus, contrast, reduced motion, and the chart's visual relationship to authored geography.

### Candidate files to inspect

- `game/features/dashboard/meridian-dashboard.tsx`
- `game/features/dashboard/city-actions/city-action-panel.tsx`
- `game/features/dashboard/city-actions/harbor-panel.tsx`
- `game/features/dashboard/sidebars/dashboard-sidebars.tsx`
- `game/features/dashboard/voyage/voyage-status-panel.tsx`
- `game/features/dashboard/meridian-dashboard.module.css`
- `game/features/dashboard/dashboard-types.ts`
- `game/application/use-game-store.ts`
- `test/unit/dashboard.test.tsx`
- `test/unit/use-game-store.test.tsx`
- `test/e2e/application.smoke.spec.ts`
- `dev/screenshot/chrome_jT1DlpoTqu.png`

## Non-Goals

1. Implementing pathfinding, quote formulas, persisted Voyage migration, or arrival settlement in presentation code.
2. Remote buying, selling, provisioning, Market Session generation, or speculative current prices.
3. Free-form ship steering, player-authored paths, mandatory zoom and pan, or a third-party geographic map platform.
4. Final visual-regression infrastructure or final Mediterranean art coverage.

## Acceptance Criteria

1. The chart renders all known Ports, current location, authored relative positions, and the selected legal passage from domain content rather than hard-coded Lisbon／Faro／Tangier CSS.
2. Selecting a Port reveals Level, specialty or catalog context, Region, SubRegion, reachability, passage duration, Supplies, risk, and traversed waters before any departure occurs.
3. Set Sail is a separate revalidated command with a visible disabled reason; selecting or inspecting a remote Port never mutates canonical game or Market state.
4. Port Level and specialty intelligence are no longer confined to the Known waters sidebar, and no second decorative map competes with the Harbor chart.
5. Visual and textual chart controls expose equivalent current-location, destination, path, cost, risk, and disabled-state meaning on desktop, mobile, keyboard, touch, reduced motion, and assistive technology.
6. Underway and arrival presentation hand off to the persisted Voyage and canonical settlement rather than maintaining a presentation-owned travel state.
