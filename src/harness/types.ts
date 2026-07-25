import type { GameState } from "@/core/model/game";

/**
 * An authored world a browser or unit test can start from. Scenarios exist so a
 * test can begin mid-flow — already at sea, already provisioned — instead of
 * driving the UI through every prior step.
 */
export type Scenario = {
  /** Selects the scenario through the `scenario` query parameter. */
  id: string;
  /** What this world is for, shown in the debug interface. */
  description: string;
  createState(now: number): GameState;
};
