import { lazy, Suspense } from "react";
import { MeridianDashboard } from "@/ui/dashboard/meridian-dashboard";

// The debug surface exists only in development builds: the DEV-guarded lazy import
// lets the production bundle tree-shake the entire `src/app/debug` subtree, so any
// `/debug` path in production simply renders the game.
const DebugRouter = import.meta.env.DEV
  ? lazy(() => import("@/app/debug/debug-router").then((module) => ({ default: module.DebugRouter })))
  : undefined;

export function App() {
  const path = window.location.pathname;
  if (DebugRouter && (path === "/debug" || path.startsWith("/debug/"))) {
    return (
      <Suspense fallback={null}>
        <DebugRouter />
      </Suspense>
    );
  }
  return <MeridianDashboard />;
}
