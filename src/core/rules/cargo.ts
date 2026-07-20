import type { WorldContent } from "@/core/content/world-content";
import type { GameEvent, SupplyRestockCause } from "@/core/events/game-events";
import { SUPPLY_IDS, type CargoStack, type SupplyId, type V5GameState } from "@/core/models/game";

/**
 * What a rule produced: the next state, the domain facts it established, and an
 * optional refusal reason. Rules never compose player-facing copy; the runtime
 * renders events into the activity feed.
 */
export type RuleResult = { state: V5GameState; events: readonly GameEvent[]; error?: string };
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
    return { state, events: [], error: "Supply target must be a non-negative whole number." };
  const maximumTarget = supplyTargetMaximum(state, supplyId);
  if (target > maximumTarget)
    return {
      state,
      events: [],
      error: `Supply target requires ${target} Cargo Capacity; only ${maximumTarget} remains after other targets.`,
    };
  return {
    state: {
      ...state,
      fleet: { ...state.fleet, supplyTargets: { ...state.fleet.supplyTargets, [supplyId]: target } },
    },
    events: [],
  };
}
export function supplyTargetMaximum(state: V5GameState, supplyId: SupplyId): number {
  return (
    state.fleet.cargoCapacity -
    SUPPLY_IDS.reduce((sum, id) => sum + (id === supplyId ? 0 : state.fleet.supplyTargets[id]), 0)
  );
}
export function setAutoRestockOnArrival(state: V5GameState, enabled: boolean): RuleResult {
  return { state: { ...state, fleet: { ...state.fleet, autoRestockOnArrival: enabled } }, events: [] };
}
export function supplyRestockPlan(content: WorldContent, state: V5GameState): SupplyRestockPlan {
  const deficits = Object.fromEntries(
    SUPPLY_IDS.map((id) => [id, Math.max(0, state.fleet.supplyTargets[id] - state.fleet.supplies[id].quantity)]),
  ) as Record<SupplyId, number>;
  const totalQuantity = SUPPLY_IDS.reduce((sum, id) => sum + deficits[id], 0);
  const port = content.getPort(state.fleet.locationPortId);
  if (state.voyage)
    return { deficits, totalQuantity, totalCost: 0, error: "Supplies cannot be bought during a Voyage." };
  if (!port)
    return { deficits, totalQuantity, totalCost: 0, error: "Supply purchase is unavailable at the current location." };
  const totalCost = SUPPLY_IDS.reduce((sum, id) => sum + deficits[id] * content.supplyPrices[id], 0);
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
export function restockSupplies(
  content: WorldContent,
  state: V5GameState,
  now: number,
  cause: SupplyRestockCause = { kind: "manual" },
): RuleResult {
  const plan = supplyRestockPlan(content, state);
  if (plan.totalQuantity === 0) return { state, events: [], error: "Targets already met." };
  if (plan.error) return { state, events: [], error: plan.error };
  return {
    state: {
      ...state,
      fleet: {
        ...state.fleet,
        gold: state.fleet.gold - plan.totalCost,
        supplies: Object.fromEntries(
          SUPPLY_IDS.map((id) => {
            const stack = state.fleet.supplies[id];
            const cost = plan.deficits[id] * content.supplyPrices[id];
            return [id, { quantity: stack.quantity + plan.deficits[id], totalCostBasis: stack.totalCostBasis + cost }];
          }),
        ) as V5GameState["fleet"]["supplies"],
      },
    },
    events: [{ kind: "supplies-restocked", at: now, quantity: plan.totalQuantity, cause }],
  };
}
export function supplyPurchaseError(
  content: WorldContent,
  state: V5GameState,
  supplyId: SupplyId,
  quantity: number,
): string | null {
  const port = content.getPort(state.fleet.locationPortId);
  if (state.voyage) return "Supplies cannot be bought during a Voyage.";
  if (!validQuantity(quantity)) return "Quantity must be a positive whole number.";
  if (!port) return "Supply purchase is unavailable at the current location.";
  const cost = content.supplyPrices[supplyId] * quantity;
  const remainingCapacity = state.fleet.cargoCapacity - usedCargo(state);
  if (quantity > remainingCapacity) return `Requires ${quantity} Cargo Capacity; only ${remainingCapacity} remains.`;
  if (cost > state.fleet.gold) return `Requires ${cost} Gold; only ${state.fleet.gold} is available.`;
  return null;
}
export function buySupply(
  content: WorldContent,
  state: V5GameState,
  supplyId: SupplyId,
  quantity: number,
  now: number,
): RuleResult {
  const error = supplyPurchaseError(content, state, supplyId, quantity);
  if (error) return { state, events: [], error };
  const cost = content.supplyPrices[supplyId] * quantity;
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
    },
    events: [{ kind: "supply-bought", at: now, supplyId, quantity }],
  };
}
export function discardSupply(state: V5GameState, supplyId: SupplyId, quantity: number): RuleResult {
  const stack = state.fleet.supplies[supplyId];
  if (state.voyage || !validQuantity(quantity) || quantity > stack.quantity)
    return { state, events: [], error: "Not enough Supply to discard." };
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
    events: [],
  };
}
