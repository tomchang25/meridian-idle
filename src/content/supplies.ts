import type { SupplyId } from "@/core/models/game";

/** One fixed price per Supply, identical at every Port. */
export const SUPPLY_PRICES: Record<SupplyId, number> = {
  food: 8,
  water: 4,
  medicine: 30,
  munitions: 18,
  spares: 24,
};
