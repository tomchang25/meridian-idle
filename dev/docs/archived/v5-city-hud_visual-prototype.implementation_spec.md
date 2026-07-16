# V5 City HUD Visual Prototype Implementation Spec

Parent Plan: none (standalone spec)

Status: Completed and superseded by the production HUD integration.

## Goal

Create an isolated, reviewable prototype of Meridian Idle's V5 city HUD so its information hierarchy, maritime visual language, city-action navigation, and responsive behavior can be approved before production gameplay is remapped into it.

## Summary

The prototype adds a dedicated `/hud-demo` route and leaves the current playable dashboard unchanged. It presents an English-language, Age of Sail management interface with an original pixel-art harbor scene, a compact global resource bar, long-term player and Fleet information on the left, selectable city actions in the center, short-term Cargo and Provisioning details on the right, and a complete Activity Log below the selected action.

The center uses three mutually exclusive city commands: Market, Supplies Management, and Harbor. A clearly labelled prototype-state control also switches between Docked and Underway presentations so reviewers can inspect the Voyage progress placement and at-sea scene without waiting for gameplay. All values and interactions are local demo fixtures; they do not call application commands, save data, or claim to be production game state.

The prototype must remain usable as a single-column layout on narrow screens, retain native controls and visible focus, expose selected and progress states semantically, and avoid copying external game artwork or introducing production assets before the direction is approved.

## Requirements

1. Keep all visible interface copy in English and use an original maritime visual treatment rather than reproducing the reference game's copyrighted assets.
2. Present Gold, Cargo, Port Level, and textual Save Status in a compact global Top Bar.
3. Use the Left Sidebar for long-term information: real-shaped Fleet and region summaries plus clearly marked placeholders for player systems that do not exist in V5 Core.
4. Make the Pixel Art Scene a dominant center-region element with visibly different Docked and Underway compositions.
5. Present Market, Supplies Management, and Harbor as mutually exclusive city actions so only the selected operation occupies the center workspace.
6. Place Voyage route, remaining time, and progress at the top of the Action Panel during the Underway preview; city actions must not appear usable at sea.
7. Use the Right Sidebar for detailed Product Cargo and Provisioning ledgers without making it the primary command surface.
8. Place the complete fixture Activity Log in a dedicated panel below the center action content.
9. Reflow without horizontal page scrolling from the desktop three-column HUD to a readable narrow single-column presentation.
10. Keep the prototype isolated from the current dashboard, game store, domain rules, persistence, migration, PWA lifecycle, and authored content.

## Relational Context

- `app/hud-demo/page.tsx` is a server route that supplies metadata and renders the feature-owned client prototype; it does not become a gameplay state owner.
- `CityHudDemo` owns only transient prototype selection between city commands and preview modes. Its fixture values are presentation samples and must not be imported by the game store, domain rules, or persistence.
- The demo must not import `useGameStore`, dispatch Buy, Sell, Supply, Voyage, or recovery commands, or write IndexedDB. Existing gameplay remains exclusively available through the root route and `MeridianDashboard`.
- The demo's CSS Module owns all prototype geometry, ornate panel treatment, pixel-scene composition, and responsive behavior. `app/globals.css` continues to own global tokens, base typography, focus indication, and reduced-motion defaults.
- The route and feature component use semantic landmarks, native buttons, textual placeholder/status labels, `aria-pressed` selection state, and a native progress element. CSS may change geometry at breakpoints but must not remove information or controls.
- The rendered prototype test exercises local preview and city-action selection only. Existing dashboard tests continue to protect production state-to-view and command wiring and must remain unchanged.

## Scope

### Included

- Dedicated visual prototype route.
- Docked and Underway scene previews.
- Three selectable city-action presentations.
- Long-term and short-term sidebars.
- Fixture Activity Log.
- Desktop, intermediate, and mobile prototype layouts.
- Focused rendered interaction coverage.

### Excluded

- Replacing or modifying the production dashboard.
- Game-store, command, timer, domain, persistence, migration, or save-status integration.
- Production artwork, external assets, copied game imagery, sound, or final animation polish.
- New gameplay systems or persisted placeholder data.
- Final HUD acceptance or production rollout before human visual review.

## Files to Change

| File                                               | Change Size | Purpose                                                                       |
| -------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `app/hud-demo/page.tsx`                            | Small       | Expose the isolated review route and metadata.                                |
| `game/features/dashboard/city-hud-demo.tsx`        | Large       | Render fixture HUD states and local prototype interactions.                   |
| `game/features/dashboard/city-hud-demo.module.css` | Large       | Own the visual language, pixel scenes, panel geometry, and responsive reflow. |
| `tests/city-hud-demo.test.tsx`                     | Small       | Verify city-command and preview-state switching through accessible controls.  |

## Execution Outline

1. Add the isolated route and client prototype with local fixture state, semantic landmarks, all confirmed HUD regions, and no production imports.
2. Build the CSS Module around the wide three-column shell, original pixel harbor and Voyage compositions, ornate city-command rail, dense ledgers, Activity Log, and narrow reflow.
3. Add rendered coverage for city-action selection and Underway progress visibility, then run focused and repository verification without changing production expectations.

## Implementation Notes

- City command buttons use explicit pressed state and update one labelled content region. They are not route navigation and do not persist selection.
- The prototype-state switch is visibly labelled as a demo-only control. It must not be presented as part of the intended production Top Bar.
- The Underway preview uses fixed fixture progress and remaining time. Production progress derivation from `departedAt` and `plannedArrivesAt` belongs to the later integration spec.
- Placeholder cards say `Planned system` or `Not available in V5 Core`; they never show invented Captain levels, Fame, skills, officers, or rewards.
- Product and Supply samples may resemble current V5 content for visual realism but remain local fixtures and are not content authority.
- Scene animation is optional and atmospheric only. Reduced-motion presentation must remain visually complete.

## Edge Cases

| Case                                | Expected Handling                                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Underway preview                    | City command controls are replaced by Voyage information and an explicit statement that city operations resume after arrival. |
| Empty or unavailable future systems | Placeholder labels communicate absence without fake values or disabled controls that imply implemented gameplay.              |
| Narrow viewport or zoom reflow      | Sidebars and center panels become one readable flow with no clipped commands, ledgers, or Activity entries.                   |
| Long Activity or ledger text        | Content wraps inside its panel and does not overlap neighboring columns or controls.                                          |
| Reduced motion                      | Pixel scenes retain their full static composition without relying on animation to communicate state.                          |

## Acceptance Criteria

1. Visiting `/hud-demo` shows a deliberate English maritime HUD without changing the playable root dashboard.
2. The desktop prototype clearly separates long-term status, the Pixel Art Scene and city actions, and short-term Cargo and Provisioning details.
3. Reviewers can switch among Market, Supplies Management, and Harbor and see only the selected city operation.
4. Reviewers can switch to the Underway preview and see a sea scene plus Voyage route, textual remaining time, risk, and semantic progress at the top of the Action Panel.
5. The Activity Log remains a dedicated center panel and all fixture entries remain available.
6. Player-system placeholders are explicitly labelled and cannot be mistaken for live V5 progression.
7. The prototype remains readable and operable at narrow viewport widths with visible keyboard focus and no horizontal page scrolling.
8. Existing production dashboard behavior and tests remain unchanged, and repository verification passes.
