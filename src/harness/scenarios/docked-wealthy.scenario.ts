import { createInitialGameState } from "@/core/state/initial-game-state";
import type { Scenario } from "@/harness/types";

/** Docked at Lisbon with enough Gold that trade tests never fail on affordability. */
export const dockedWealthy: Scenario = {
  id: "docked-wealthy",
  description: "Docked at Lisbon with ample Gold for Market exercises.",
  createState(now) {
    const state = createInitialGameState(now);
    return { ...state, fleet: { ...state.fleet, gold: 50_000 } };
  },
};

export default dockedWealthy;
