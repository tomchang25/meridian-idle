import { setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import { restockSupplies } from "@/core/rules/cargo";
import { departVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import type { Scenario } from "@/harness/types";

/**
 * At sea between Lisbon and Faro with auto-restock armed, so a test can advance
 * time past arrival and observe settlement without sailing in real time.
 */
export const midVoyage: Scenario = {
  id: "mid-voyage",
  description: "Departed Lisbon for Faro with Supply targets set and auto-restock enabled.",
  createState(now) {
    let state = createInitialGameState(now);
    state = setSupplyTarget(state, "food", 4).state;
    state = setSupplyTarget(state, "water", 4).state;
    state = restockSupplies(state, now).state;
    state = setAutoRestockOnArrival(state, true).state;
    return departVoyage(state, "lisbon-faro", now, 3).state;
  },
};

export default midVoyage;
