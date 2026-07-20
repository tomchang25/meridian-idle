"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { installDebugApi } from "@/harness/debug-api";
import { createHarnessClock } from "@/harness/harness-clock";
import { findScenario } from "@/harness/scenario-registry";
import { useGameStore } from "@/runtime/use-game-store";
import { DashboardView, MeridianDashboard } from "@/ui/dashboard/meridian-dashboard";

/** The URL scenario never changes after load, so this store never notifies. */
const subscribeToNothing = () => () => {};

function readScenarioId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get("scenario");
  } catch {
    return null;
  }
}

/**
 * The composition root for the playable surface. Normally it renders the
 * dashboard on its own dependencies; when the URL names a scenario it starts
 * from that authored world on a hand-driven clock and publishes the debug
 * interface, so browser tests reach mid-flow states without waiting on real time.
 */
export function GameSurface() {
  // The server cannot see the URL scenario. Returning null as the server
  // snapshot lets React reconcile the difference on the client instead of
  // treating it as a hydration mismatch.
  const scenarioId = useSyncExternalStore(subscribeToNothing, readScenarioId, () => null);
  const scenario = useMemo(() => findScenario(scenarioId), [scenarioId]);

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
