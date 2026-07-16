# V5 Core MVP HUD Recovery Implementation Spec

Parent Plan: `v5-core-mvp-agent-experiment.md`

## Goal

Restore a coherent responsive maritime HUD for the delivered V5 Core MVP while preserving its gameplay, command-feedback, persistence, migration, and Voyage behavior.

## Summary

The V5 dashboard currently renders accessible gameplay content as an unstyled document because its owning CSS Module was disconnected during the V5 shell rewrite. The retained stylesheet still describes the obsolete V3 Action dashboard, so restoring one import without remapping responsibilities would revive controls and layout assumptions that no longer exist.

This change rebuilds the dashboard presentation around the current V5 state model. A stable shell will distinguish global save status, Port and Fleet summary, recovery and command feedback, the docked Market/Cargo/Provisioning/Routes workspace or active Voyage, and the latest arrival result. Wide, intermediate, and narrow layouts will use the same semantic DOM order and keep every required action and status available.

The dashboard will again import its co-located CSS Module, but the module will be replaced with selectors that have active V5 responsibilities. Rendered tests will protect state-to-view mapping and interactions; repository verification and explicit human responsive review remain the completion gates. Browser smoke and Playwright journey work are excluded.

## Relational Context

- `MeridianDashboard` reads application state and command functions from `useGameStore`; it must continue to render those values and dispatch user intent without taking ownership of game formulas, persistence, save transitions, or Voyage resolution.
- Market, Cargo, progression, and Voyage rule functions remain the authority for prices, capacity, levels, and disabled reasons. Styling may group or label their output but must not duplicate or reinterpret eligibility.
- The dashboard owns `meridian-dashboard.module.css`. Every retained selector must be imported and used by the component, while global tokens, base typography, focus indication, and reduced-motion defaults remain owned by `app/globals.css`.
- DOM order remains the reading and keyboard order across breakpoints. CSS Grid may change column geometry but must not hide, duplicate, or visually reorder required feedback, recovery, information, or controls.
- Docked and in-transit states remain mutually exclusive application branches. Their presentation must share the same top-level workspace geometry without adding unavailable navigation, filters, Voyage cancellation, progress simulation, or future gameplay.
- Save, command-error, migration, disabled-reason, and latest-result text remains available through its existing semantic status, alert, description, and live-region relationships. Presentation cannot rely on color alone.
- Component tests mock `useGameStore` and assert rendered behavior. They should vary the typed save and game state fixture rather than assert CSS implementation details.

## Scope

### Included

- Reconnect and rebuild the dashboard-owned CSS Module for the current V5 regions and states.
- Add stable wide, intermediate, and single-column responsive layouts.
- Distinguish saved, saving, unavailable, loading, and corrupt presentation.
- Preserve visible command errors, migration recovery, disabled reasons, docked operations, active Voyage, and latest results.
- Add rendered regression coverage for the state branches and command wiring touched by the recovery.

### Excluded

- Domain rules, application commands, persistence, migration payloads, save scheduling, and authored content.
- New artwork, navigation, filters, animation systems, Voyage progress calculation, cancellation, or Child 06-08 gameplay.
- Browser smoke, Playwright journey repair, visual-regression infrastructure, or final production art direction.

## Files to Change

| File                                                    | Change Size | Purpose                                                                                   |
| ------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `game/features/dashboard/meridian-dashboard.tsx`        | Large       | Map existing V5 states and commands into the responsive semantic HUD shell.               |
| `game/features/dashboard/meridian-dashboard.module.css` | Large       | Replace orphaned V3 selectors with the active maritime layout and component state styles. |
| `tests/dashboard.test.tsx`                              | Medium      | Cover recovery, save, docked, Voyage, result, disabled-reason, and command interactions.  |

## Execution Outline

1. Rework `MeridianDashboard` into stable header, summary, feedback, workspace, and result regions; import the CSS Module and preserve all existing domain and command call directions.
2. Replace the disconnected V3 stylesheet with V5-owned shell, panel, card, action, status, and responsive rules that never hide required content.
3. Expand the dashboard store fixture and rendered assertions across loading, corrupt, save-degraded, migration, docked, in-transit, result, and disabled states.
4. Run the focused dashboard test, full repository verification, and report the remaining manual responsive, keyboard, reduced-motion, and assistive-technology review boundary.

## Implementation Notes

- Keep the feature in one component unless markup extraction establishes a real reusable semantic boundary; visual grouping alone does not require new components.
- Use native landmarks, headings, lists, and buttons. Associate disabled reasons through `aria-describedby`, and keep dynamic command errors and latest results appropriately announced.
- The header should expose a textual save label for every normal save status. Loading and corrupt recovery remain dedicated top-level branches with the same visual language.
- Market entries, Fleet Cargo, Provisioning, and Routes should use dense but reflowable cards or rows. Long unavailable reasons must wrap without overlapping controls.
- Do not preserve selector names merely because they exist. Remove V3 navigation, tabs, filters, Action status, fake progress, stop control, scene illustration, and mobile-navigation selectors when replacing the module.

## Edge Cases

| Case                                   | Expected Handling                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Storage unavailable                    | The HUD remains usable and clearly says the session is not being saved.                               |
| Corrupt save                           | Only the non-destructive recovery explanation and new-game action are presented.                      |
| Migration plus command error or result | Each remains readable and reachable without overlap or responsive hiding.                             |
| Active Voyage                          | Docked operations are absent, while Voyage status and latest result retain the common shell geometry. |
| Long disabled reason                   | The reason remains visible, associated with its control, and wraps within the layout.                 |
| Narrow viewport or zoom reflow         | All information and actions remain available in semantic order without horizontal page scrolling.     |

## Acceptance Criteria

1. The V5 dashboard presents a deliberate maritime hierarchy through its owned CSS Module rather than an unstyled document flow.
2. Wide, intermediate, and narrow layouts provide equivalent Market, Cargo, Provisioning, Route, migration, error, save, and Voyage information and actions.
3. Keyboard order, visible focus, semantic labels, disabled reasons, and non-color status remain intact across docked and in-transit states.
4. No obsolete V3 selector or unsupported control remains, and gameplay, application, persistence, and migration contracts are unchanged.
5. Focused rendered tests and repository verification pass, with manual responsive visual review explicitly completed or reported as outstanding.
