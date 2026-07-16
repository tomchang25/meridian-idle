import type { CargoStack, SupplyId, V5GameState } from "@/game/domain/models/game";
import { getPort } from "@/game/domain/content/core-content";

export type RuleResult = { state: V5GameState; error?: string };
export function roundHalfUp(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value + 0.5) : 0;
}
export function removedCostBasis(stack: CargoStack, quantity: number): number {
  if (quantity >= stack.quantity) return stack.totalCostBasis;
  return Math.min(stack.totalCostBasis, roundHalfUp((stack.totalCostBasis * quantity) / stack.quantity));
}
export function usedCargo(state: V5GameState): number {
  return [...Object.values(state.fleet.products), ...Object.values(state.fleet.supplies)].reduce(
    (sum, stack) => sum + stack.quantity,
    0,
  );
}
export function validQuantity(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity > 0;
}
export function supplyPurchaseError(state: V5GameState, supplyId: SupplyId, quantity: number): string | null {
  const port = getPort(state.fleet.locationPortId);
  if (state.voyage) return "Supplies cannot be bought during a Voyage.";
  if (!validQuantity(quantity)) return "Quantity must be a positive whole number.";
  if (!port) return "Supply purchase is unavailable at the current location.";
  const cost = port.supplyPrices[supplyId] * quantity;
  const remainingCapacity = state.fleet.cargoCapacity - usedCargo(state);
  if (quantity > remainingCapacity) return `Requires ${quantity} Cargo Capacity; only ${remainingCapacity} remains.`;
  if (cost > state.fleet.gold) return `Requires ${cost} Gold; only ${state.fleet.gold} is available.`;
  return null;
}
export function buySupply(state: V5GameState, supplyId: SupplyId, quantity: number, now: number): RuleResult {
  const error = supplyPurchaseError(state, supplyId, quantity);
  if (error) return { state, error };
  const port = getPort(state.fleet.locationPortId)!;
  const cost = port.supplyPrices[supplyId] * quantity;
  const stack = state.fleet.supplies[supplyId];
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        gold: state.fleet.gold - cost,
        supplies: {
          ...state.fleet.supplies,
          [supplyId]: { quantity: stack.quantity + quantity, totalCostBasis: stack.totalCostBasis + cost },
        },
      },
      activity: [
        { id: `supply-${now}`, at: now, message: `Bought ${quantity} ${supplyId}.`, tone: "success" as const },
        ...state.activity,
      ].slice(0, 24),
    },
  };
}
export function discardSupply(state: V5GameState, supplyId: SupplyId, quantity: number): RuleResult {
  const stack = state.fleet.supplies[supplyId];
  if (state.voyage || !validQuantity(quantity) || quantity > stack.quantity)
    return { state, error: "Not enough Supply to discard." };
  const cost = removedCostBasis(stack, quantity);
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        supplies: {
          ...state.fleet.supplies,
          [supplyId]: { quantity: stack.quantity - quantity, totalCostBasis: stack.totalCostBasis - cost },
        },
      },
    },
  };
}
