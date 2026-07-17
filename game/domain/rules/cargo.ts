import { SUPPLY_IDS, type CargoStack, type SupplyId, type V5GameState } from "@/game/domain/models/game";
import { getPort } from "@/game/domain/content/core-content";

export type RuleResult = { state: V5GameState; error?: string };
export type SupplyRestockPlan = {
  deficits: Record<SupplyId, number>;
  totalQuantity: number;
  totalCost: number;
  error: string | null;
};
export function roundHalfUp(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value + 0.5) : 0;
}
export function removedCostBasis(stack: CargoStack, quantity: number): number {
  if (quantity >= stack.quantity) return stack.totalCostBasis;
  return Math.min(stack.totalCostBasis, roundHalfUp((stack.totalCostBasis * quantity) / stack.quantity));
}
export function averageUnitCost(stack: CargoStack | undefined): number | null {
  return stack && stack.quantity > 0 ? stack.totalCostBasis / stack.quantity : null;
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
export function setSupplyTarget(state: V5GameState, supplyId: SupplyId, target: number): RuleResult {
  if (!Number.isSafeInteger(target) || target < 0)
    return { state, error: "Supply target must be a non-negative whole number." };
  const maximumTarget = supplyTargetMaximum(state, supplyId);
  if (target > maximumTarget)
    return {
      state,
      error: `Supply target requires ${target} Cargo Capacity; only ${maximumTarget} remains after other targets.`,
    };
  return {
    state: {
      ...state,
      fleet: { ...state.fleet, supplyTargets: { ...state.fleet.supplyTargets, [supplyId]: target } },
    },
  };
}
export function supplyTargetMaximum(state: V5GameState, supplyId: SupplyId): number {
  return (
    state.fleet.cargoCapacity -
    SUPPLY_IDS.reduce((sum, id) => sum + (id === supplyId ? 0 : state.fleet.supplyTargets[id]), 0)
  );
}
export function setAutoRestockOnArrival(state: V5GameState, enabled: boolean): RuleResult {
  return { state: { ...state, fleet: { ...state.fleet, autoRestockOnArrival: enabled } } };
}
export function supplyRestockPlan(state: V5GameState): SupplyRestockPlan {
  const deficits = Object.fromEntries(
    SUPPLY_IDS.map((id) => [id, Math.max(0, state.fleet.supplyTargets[id] - state.fleet.supplies[id].quantity)]),
  ) as Record<SupplyId, number>;
  const totalQuantity = SUPPLY_IDS.reduce((sum, id) => sum + deficits[id], 0);
  const port = getPort(state.fleet.locationPortId);
  if (state.voyage)
    return { deficits, totalQuantity, totalCost: 0, error: "Supplies cannot be bought during a Voyage." };
  if (!port)
    return { deficits, totalQuantity, totalCost: 0, error: "Supply purchase is unavailable at the current location." };
  const totalCost = SUPPLY_IDS.reduce((sum, id) => sum + deficits[id] * port.supplyPrices[id], 0);
  const remainingCapacity = state.fleet.cargoCapacity - usedCargo(state);
  if (totalQuantity > remainingCapacity)
    return {
      deficits,
      totalQuantity,
      totalCost,
      error: `Requires ${totalQuantity} Cargo Capacity; only ${remainingCapacity} remains.`,
    };
  if (totalCost > state.fleet.gold)
    return {
      deficits,
      totalQuantity,
      totalCost,
      error: `Requires ${totalCost} Gold; only ${state.fleet.gold} is available.`,
    };
  return { deficits, totalQuantity, totalCost, error: null };
}
export function restockSupplies(state: V5GameState, now: number, activityId = `supply-restock-${now}`): RuleResult {
  const plan = supplyRestockPlan(state);
  if (plan.totalQuantity === 0) return { state, error: "Targets already met." };
  if (plan.error) return { state, error: plan.error };
  const port = getPort(state.fleet.locationPortId)!;
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        gold: state.fleet.gold - plan.totalCost,
        supplies: Object.fromEntries(
          SUPPLY_IDS.map((id) => {
            const stack = state.fleet.supplies[id];
            const cost = plan.deficits[id] * port.supplyPrices[id];
            return [id, { quantity: stack.quantity + plan.deficits[id], totalCostBasis: stack.totalCostBasis + cost }];
          }),
        ) as V5GameState["fleet"]["supplies"],
      },
      activity: [
        { id: activityId, at: now, message: `Restocked ${plan.totalQuantity} Supply units.`, tone: "success" as const },
        ...state.activity,
      ].slice(0, 24),
    },
  };
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
