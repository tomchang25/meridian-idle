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
export function buySupply(state: V5GameState, supplyId: SupplyId, quantity: number, now: number): RuleResult {
  const port = getPort(state.fleet.locationPortId);
  if (state.voyage || !port || !validQuantity(quantity)) return { state, error: "Supply purchase is unavailable." };
  const cost = port.supplyPrices[supplyId] * quantity;
  if (usedCargo(state) + quantity > state.fleet.cargoCapacity) return { state, error: "Not enough Cargo Capacity." };
  if (cost > state.fleet.gold) return { state, error: "Not enough Gold." };
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
