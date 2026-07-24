# Meridian React Component Addendum

Read `dev/foundation/platforms/web-react/standards/react_component_standard.md` first. This addendum owns only Meridian's rendering-boundary decision.

Meridian is a plain Vite single-page app: every component runs on the client, so there is no server/client rendering boundary to declare. The Next-era `"use client"` directive is obsolete here and must never be added. A component being client-side does not make it an owner of game formulas, persisted state, or application commands — that ownership lives in `src/core` and `src/runtime`.

Meridian's feature placement and co-location rules are owned by `project_structure.md`, not duplicated here.
