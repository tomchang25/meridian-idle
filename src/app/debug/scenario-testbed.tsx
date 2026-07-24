import { useEffect, useMemo, useRef } from "react";
import { installDebugApi } from "@/harness/debug-api";
import { createHarnessClock } from "@/harness/harness-clock";
import { findScenario } from "@/harness/scenario-registry";
import { useGameStore } from "@/runtime/use-game-store";
import { DashboardView, MeridianDashboard } from "@/ui/dashboard/meridian-dashboard";

function readScenarioId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get("scenario");
  } catch {
    return null;
  }
}

/**
 * The `/debug/game` dev tool. When the URL names a scenario it starts the store
 * from that authored world on a hand-driven clock and publishes the debug
 * interface, so browser tests reach mid-flow states without waiting on real
 * time. With no or an unknown scenario it renders ordinary play.
 */
export function ScenarioTestbed() {
  const scenario = findScenario(readScenarioId());
  if (!scenario) return <MeridianDashboard />;
  return <HarnessSurface scenario={scenario} />;
}

function HarnessSurface({ scenario }: { scenario: NonNullable<ReturnType<typeof findScenario>> }) {
  const clock = useMemo(() => createHarnessClock(), []);
  const initialState = useMemo(() => scenario.createState(clock.now()), [clock, scenario]);
  const store = useGameStore({ clock, initialState });

  // The debug interface reads the latest store without being reinstalled on
  // every render, so the ref is refreshed after commit rather than during render.
  const latest = useRef(store);
  useEffect(() => {
    latest.current = store;
  });

  useEffect(
    () =>
      installDebugApi({
        clock,
        scenarioId: scenario.id,
        getState: () => latest.current.state,
        settle: () => latest.current.resolveVoyage(),
      }),
    [clock, scenario.id],
  );

  return <DashboardView store={store} />;
}
