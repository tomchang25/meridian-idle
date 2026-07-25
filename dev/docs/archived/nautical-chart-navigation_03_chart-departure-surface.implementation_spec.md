# Nautical Chart Navigation 03 — Chart Departure Surface

Parent Plan: `nautical-chart-navigation.md`

## Goal

Replace the hard-coded Known waters illustration and direct-route Harbor cards with one accessible nautical-chart departure workspace. The chart must expose authored relative geography, Port intelligence, deterministic passage preview, and explicit departure without owning navigation rules, remote Market state, or Voyage progress.

## Summary

The docked Harbor becomes the production nautical-chart command surface. It opens with the current Port selected, renders every known Port from authored chart coordinates, and lets the player deliberately select a remote destination before seeing its Passage and using one `Set Sail` command.

The visual is built as independent layers in a fixed 16:9 chart canvas and authored coordinate space: a replaceable parchment world-map placeholder asset, presentation-only Region/SubRegion context, legal sea lanes, the selected Passage, and Port markers. Future historical or fictional map artwork can replace the background and authored coordinates without changing planner, Voyage, selection, or accessibility contracts.

Selected-Port intelligence shows Region, SubRegion, Level, named Specialty and unlock level, and whether Market information is available at the current berth or only after docking. Passage details come only from the existing read-only preview and include distance, scheduled duration, Food, Water, static risk, ordered traversed waters, and the visible disabled reason. Selecting a Port never creates a remote Market Session.

The same native Port controls that select the map destination remain keyboard- and touch-operable and become a compact semantic list when the layout narrows. The visual chart is never the only source of current location, selection, route, cost, risk, or failure meaning. Departure hands directly to the persisted Voyage presentation; this child adds no presentation-owned travel state.

## Relational Context

- `HarborPanel` owns transient selected-Port state and reads `DashboardStore.previewVoyage` only for a selected remote Port; it never derives pathfinding, economics, or canonical availability in presentation.
- `previewVoyagePassage` remains the single quote owner and `departVoyage` remains the revalidating mutation command. `Set Sail` passes the selected Port and current quote identity through the existing store contract.
- Authored `chartPosition`, Port membership, navigation edges, and product Specialty identity are content authority. The chart may derive display geometry and ordered water names but must not persist those presentation results or reinterpret graph costs.
- The placeholder map is a replaceable runtime content asset in the same 0–1000 authored coordinate space as Port positions, rendered through one fixed 16:9 canvas. Route and Port interaction layers must not be baked into the artwork.
- Region/SubRegion shapes are presentation context, not routing nodes or permanent geographic truth. A future map may replace derived overlays with authored polygons without changing the chart's public selection and Passage contracts.
- The Port controls are the interaction authority for both pointer and keyboard users. SVG route and background layers may be hidden from assistive technology only while adjacent native controls and details expose equivalent meaning.
- `LongTermSidebar` relinquishes Known waters and Port progression-map ownership. Current Port standing remains available in the existing short-term sidebar, while all known Port Levels and selected Specialty intelligence move into the Harbor chart.
- The existing `state.voyage` branch remains the sole docked-to-underway handoff. Child 03 does not keep Harbor selection alive as canonical travel state or add an underway position resolver.
- `/debug/chart` remains the development topology and diagnostics owner. Production code must not expose hidden navigation nodes, edge IDs, validation diagnostics, or a debug mode.

## Scope

### Included

- A replaceable parchment map placeholder and data-driven production chart layers.
- Native known-Port selection with current and selected states that do not rely on color alone.
- Selected Port Level, Region, SubRegion, Specialty/unlock, and Market-availability context.
- Selected Passage path, ordered traversed waters, quote metrics, readiness, disabled reason, and one `Set Sail` action.
- Removal of the competing Known waters sidebar map and relocation of its useful Port intelligence.
- Responsive, keyboard, touch, reduced-motion, and assistive-text behavior at the component contract level.

### Excluded

- Planner, estimator, Voyage snapshot, persistence, arrival, or Market lifecycle changes.
- Remote prices, remote trading, provisioning, or full ten-item Port catalog display.
- Pan/zoom, map tiles, GIS projection, player-authored paths, or a third-party map platform.
- Underway edge position, boundary progress, Events, incremental Supply use, Expeditions, or diversion.
- Final Mediterranean artwork, authored geographic polygons, or visual-regression infrastructure.

## Files to Change

| File                                                           | Change Size | Purpose                                                                                                      |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `src/content/navigation/assets/nautical-chart-placeholder.svg` | Medium      | Provide replaceable map artwork without interactive or route data.                                           |
| `src/ui/dashboard/city-actions/nautical-chart.tsx`             | Large       | Render chart layers and native known-Port selection controls.                                                |
| `src/ui/dashboard/city-actions/harbor-panel.tsx`               | Large       | Own selection, selected intelligence, quote details, and Set Sail.                                           |
| `src/ui/dashboard/sidebars/dashboard-sidebars.tsx`             | Medium      | Remove the competing Known waters map and duplicated Port Level list.                                        |
| `src/ui/dashboard/meridian-dashboard.module.css`               | Large       | Style the chart layers, selected details, focus, and responsive semantic controls.                           |
| `test/unit/dashboard.test.tsx`                                 | Medium      | Prove selection/departure separation, intelligence, preview parity, mutation safety, and disabled semantics. |
| `test/e2e/application.smoke.spec.ts`                           | Small       | Keep the existing full-flow acceptance selector aligned with the new destination-first interaction.          |
| `dev/docs/reports/nautical_chart_navigation_map.html`          | Small       | Record the production chart as the current consumer boundary.                                                |

## Execution Outline

1. Add the neutral parchment placeholder in the authored chart coordinate space, with no embedded Port names, routes, or interaction.
2. Build the production chart component from known Port IDs and authored content, rendering replaceable artwork, derived geographic context, deduplicated legal lanes, selected Passage edges, and native Port controls.
3. Replace Harbor route cards with current-Port-first selection, selected intelligence, one quote detail surface, and a revalidated `Set Sail` action.
4. Remove the sidebar's hard-coded map and duplicated all-Port progression list, then adapt the existing responsive layout and reduced-motion treatment.
5. Update component coverage, the existing browser-flow selector, and the human report; run focused component tests and the required full verification without running intermediate-child browser smoke.

## Implementation Notes

- Use the existing 0–1000 authored positions as the overlay contract. The placeholder asset should have the same viewBox and may be swapped later for raster or vector artwork aligned to that space. The responsive container is fixed at 16:9 on map-sized layouts so every visual layer scales together without resolution-dependent distortion; narrow layouts retain a 16:9 map surface and move the same native controls below it.
- Initialize selection to the current Port. Do not request a planner preview until the player selects another known Port.
- Keep one native selection-control set: map-positioned on wide layouts and reflowed into a normal list on narrow layouts. Avoid duplicate focusable map and list controls.
- The selected route follows `preview.passage.edges`; resolve each edge endpoint from Port or navigation-point content. Show hidden nodes only as bends in the line, never as player-facing markers.
- Derive traversed waters by preserving first occurrence order across edge spans and resolving SubRegion display names. Do not sort them alphabetically.
- Resolve the Specialty from the product whose `specialtyOriginPortId` matches the selected Port and report its catalog unlock level. Remote price or stock data stays unavailable until actual docking.
- Preserve local selection and visible details when departure returns an error. The store's existing command feedback remains the error announcement owner.
- Update but do not run the browser smoke because project policy reserves it for main-plan final acceptance.

## Edge Cases

| Case                          | Expected Handling                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Current Port selected         | Shows current intelligence and a prompt to select another Port; no quote or departure command is produced.         |
| Known but unreachable Port    | Remains inspectable while Passage details and Set Sail expose the planner's disabled reason.                       |
| Insufficient Food or Water    | Shows required, aboard, and missing quantities; Set Sail is disabled with the preview reason.                      |
| Secure randomness unavailable | Keeps the route inspectable and disables Set Sail with the capability reason.                                      |
| Failed or stale departure     | Preserves selected Port and preview context while existing command feedback announces failure.                     |
| Narrow layout                 | Port controls leave map positioning and reflow into a readable native list without losing selection meaning.       |
| Reduced motion                | No decorative route drawing animation runs; static route, selection, and progress meaning remain visible.          |
| Future replacement map        | Background artwork and authored coordinates may change without changing planner, Voyage, or Port-control behavior. |

## Acceptance Criteria

1. The Harbor chart renders every known Port, current location, authored relative positions, and the selected legal Passage without hard-coded Lisbon/Faro/Tangier positioning in CSS.
2. Selecting a Port reveals its Level, Region, SubRegion, named Specialty context, Market availability, duration, Food, Water, risk, and ordered traversed waters before departure.
3. Selection does not mutate game or Market state, and `Set Sail` remains a separate revalidated command with an equivalent visible and programmatic disabled reason.
4. The Known waters sidebar map and duplicated Port Level list are removed, with their useful intelligence available from the chart and its native Port controls.
5. The replaceable placeholder artwork remains independent of route, Port, selection, and accessibility layers so a later fictional or historical map does not require navigation-rule changes.
6. Desktop, mobile, keyboard, touch, reduced-motion, and assistive users receive equivalent current-location, destination, path, cost, risk, and disabled-state meaning.
7. Successful departure hands off to the persisted Voyage presentation, while failed departure preserves chart selection and no presentation-owned travel state survives as canonical progress.
