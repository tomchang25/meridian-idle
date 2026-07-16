import type { CargoStack, SupplyId, V5GameState } from "@/game/domain/models/game";
import { getPort } from "@/game/domain/content/core-content";

export function usedCargo(state: V5GameState): number {
  return (
    Object.values(state.fleet.products).reduce((sum, stack) => sum + stack.quantity, 0) +
    Object.values(state.fleet.supplies).reduce((sum, stack) => sum + stack.quantity, 0)
  );
}
export function buySupply(
  state: V5GameState,
  supplyId: SupplyId,
  quantity: number,
  now: number,
): { state: V5GameState; error?: string } {
  const port = getPort(state.fleet.locationPortId);
  if (!port || !Number.isSafeInteger(quantity) || quantity <= 0)
    return { state, error: "Enter a positive whole quantity." };
  const cost = port.supplyPrices[supplyId] * quantity;
  if (usedCargo(state) + quantity > state.fleet.cargoCapacity) return { state, error: "Not enough Cargo Capacity." };
  if (cost > state.fleet.gold) return { state, error: "Not enough Gold." };
  const stack = state.fleet.supplies[supplyId] as CargoStack;
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

export function discardSupply(
  state: V5GameState,
  supplyId: SupplyId,
  quantity: number,
): { state: V5GameState; error?: string } {
  const stack = state.fleet.supplies[supplyId];
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > stack.quantity)
    return { state, error: "Not enough Supply to discard." };
  const removedCost =
    quantity === stack.quantity
      ? stack.totalCostBasis
      : Math.floor((stack.totalCostBasis * quantity) / stack.quantity + 0.5);
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        supplies: {
          ...state.fleet.supplies,
          [supplyId]: { quantity: stack.quantity - quantity, totalCostBasis: stack.totalCostBasis - removedCost },
        },
      },
    },
  };
}
