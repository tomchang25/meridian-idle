import { useEffect, useMemo, useRef } from "react";
import { installDebugApi } from "@/harness/debug-api";
import { createHarnessClock, DEBUG_TIME_SCALE } from "@/harness/harness-clock";
import { findScenario } from "@/harness/scenario-registry";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { systemClock } from "@/runtime/clock";
import { useGameStore } from "@/runtime/use-game-store";
import { DashboardView, MeridianDashboard } from "@/ui/dashboard/meridian-dashboard";

function readScenarioId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get("scenario");
  } catch {
    return null;
  }
}

function readDebugPacingMultiplier(): number | null {
  try {
    return new URL(window.location.href).searchParams.get("timeScale") === String(DEBUG_TIME_SCALE)
      ? DEBUG_TIME_SCALE
      : null;
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
  if (!scenario) {
    const pacingMultiplier = readDebugPacingMultiplier();
    return pacingMultiplier ? <PacedDebugSurface pacingMultiplier={pacingMultiplier} /> : <MeridianDashboard />;
  }
  return <HarnessSurface scenario={scenario} />;
}

function PacedDebugSurface({ pacingMultiplier }: { pacingMultiplier: number }) {
  const initialState = useMemo(() => createInitialGameState(systemClock.now()), []);
  const store = useGameStore({ initialState, voyagePacingMultiplier: pacingMultiplier });
  return <DashboardView store={store} />;
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
