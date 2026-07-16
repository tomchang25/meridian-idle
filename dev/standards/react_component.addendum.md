# Meridian React Component Addendum

Read `dev/foundation/platforms/web-react/standards/react_component_standard.md` first. This addendum owns only Meridian's rendering-boundary decision.

Meridian uses React Server Components by default. Add `"use client"` only when a component or hook requires state, effects, event handling, or a browser API. A client boundary does not make the component an owner of game formulas, persisted state, or application commands.

Meridian's feature placement and co-location rules are owned by `project_structure.md`, not duplicated here.
