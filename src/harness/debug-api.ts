import type { V5GameState } from "@/core/model/game";
import type { HarnessClock } from "@/harness/harness-clock";
import { listScenarios } from "@/harness/scenario-registry";

/**
 * What a browser test can drive from the page. Kept deliberately small: read the
 * world, move simulated time, and let the runtime settle whatever that unblocks.
 */
export type DebugApi = {
  scenarioId: string;
  /** Lists every registered scenario identifier. */
  scenarios(): string[];
  getState(): V5GameState;
  /** Moves simulated time forward and settles anything now due. Returns the new time. */
  advanceTime(milliseconds: number): number;
};

export type DebugApiBinding = {
  clock: HarnessClock;
  scenarioId: string;
  getState(): V5GameState;
  /** Re-evaluates time-driven work, such as a Voyage that has now arrived. */
  settle(): void;
};

const GLOBAL_KEY = "__MERIDIAN__";

declare global {
  interface Window {
    __MERIDIAN__?: DebugApi;
  }
}

/** Publishes the debug interface and returns a function that removes it again. */
export function installDebugApi(binding: DebugApiBinding): () => void {
  if (typeof window === "undefined") return () => {};

  window[GLOBAL_KEY] = {
    scenarioId: binding.scenarioId,
    scenarios: () => listScenarios().map((scenario) => scenario.id),
    getState: () => binding.getState(),
    advanceTime(milliseconds) {
      const at = binding.clock.advance(milliseconds);
      binding.settle();
      return at;
    },
  };

  return () => {
    delete window[GLOBAL_KEY];
  };
}
