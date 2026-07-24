import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type DebugTool = {
  id: string;
  path: string;
  title: string;
  description: string;
  Component: LazyExoticComponent<ComponentType>;
};

/**
 * The registry of dev tools. It is imported only from DEV-guarded branches, so
 * the whole catalog and every tool chunk tree-shakes out of the production
 * bundle. Adding a tool — for example the future nautical-chart diagnostic at
 * `/debug/chart` — is one entry here, not another hand-written route.
 */
export const DEBUG_TOOLS: DebugTool[] = [
  {
    id: "game",
    path: "/debug/game",
    title: "Scenario testbed",
    description: "Load an authored world with ?scenario= and drive simulated time.",
    Component: lazy(() =>
      import("@/app/debug/scenario-testbed").then((module) => ({ default: module.ScenarioTestbed })),
    ),
  },
];
