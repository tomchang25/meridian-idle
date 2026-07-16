# V5 Core MVP HUD Recovery Sketch

Parent Plan: `v5-core-mvp-agent-experiment.md`

## Goal

Explore restoration of a coherent responsive V5 HUD after the prototype dashboard stopped importing or using its existing CSS Module. The subsection should recover visual hierarchy without changing the newly repaired gameplay, eligibility, command-feedback, persistence, or Voyage contracts.

## Summary

The current dashboard renders one semantic document flow while `meridian-dashboard.module.css` still describes the earlier three-column maritime HUD and is completely disconnected from the component. The likely direction is to treat the current V5 information and actions as authority, inspect the existing module for reusable visual language, and rebuild explicit V5 layout regions rather than blindly attaching obsolete class names.

The later implementation spec should verify desktop, narrow, keyboard, focus, error, disabled-reason, migration, docked, and in-transit states. Human screenshot review remains the visual acceptance gate before closeout.

## Sketch

- The later spec should freshly map the active JSX states in `meridian-dashboard.tsx` against the large disconnected `meridian-dashboard.module.css`; selector names are provisional evidence, not implementation authority.
- A likely V5 layout separates global status, current Port and Fleet summary, Market and Cargo work area, Provisioning, Routes or active Voyage, migration recovery, and latest Result while retaining one accessible reading order.
- The CSS Module should again be imported by its owning component. Every retained selector should have an active semantic use; dead V3-era selectors should be removed instead of hidden behind placeholder markup.
- Responsive behavior likely needs explicit wide, intermediate, and single-column arrangements. Visual order must not change keyboard or screen-reader order.
- Command errors and per-control disabled reasons need space that remains readable without causing layout overlap or relying on color alone.
- The docked and in-transit branches should share stable top-level geometry so Voyage state does not collapse the whole HUD.
- Candidate files to inspect:
  - `game/features/dashboard/meridian-dashboard.tsx`
  - `game/features/dashboard/meridian-dashboard.module.css`
  - `app/globals.css`
  - `tests/dashboard.test.tsx`
  - V5 layout and design documents under `dev/docs/design/`

## Non-Goals

1. Product, Market, Cargo, progression, Voyage, seed, save, or accounting rule changes.
2. Playwright journey expansion or final smoke execution.
3. New artwork, asset pipeline, animation system, or final production art direction.
4. Child 06–08 gameplay.

## Acceptance Criteria

1. The V5 dashboard uses an owned CSS Module and presents a deliberate maritime hierarchy rather than an unstyled document flow.
2. Desktop and mobile retain equivalent Market, Cargo, Provisioning, Route, migration, error, save, and Voyage information and actions.
3. Keyboard order, visible focus, semantic labels, disabled reasons, and non-color status remain intact across docked and in-transit states.
4. No obsolete selector remains without an active V5 responsibility, and no gameplay or persistence contract changes as part of styling recovery.
5. Focused rendered tests and repository verification pass, followed by explicit human screenshot review before closeout.
