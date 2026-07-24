import { Suspense } from "react";
import { DEBUG_TOOLS } from "@/app/debug/debug-tools";
import { DebugHub } from "@/app/debug/debug-hub";

/** Dispatches within `/debug`: a catalog tool by exact path, otherwise the hub index. */
export function DebugRouter() {
  const tool = DEBUG_TOOLS.find((entry) => entry.path === window.location.pathname);
  if (!tool) return <DebugHub />;

  const Tool = tool.Component;
  return (
    <Suspense fallback={null}>
      <Tool />
    </Suspense>
  );
}
