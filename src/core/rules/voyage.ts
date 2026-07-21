import type { WorldContent } from "@/core/content/world-content";
import type { GameEvent } from "@/core/events/game-events";
import type { SupplyId, V5GameState, Voyage } from "@/core/model/game";
import { removedCostBasis, restockSupplies, supplyRestockPlan, type RuleResult } from "@/core/rules/cargo";
import { settlePortEntry } from "@/core/rules/progression";

function consumeSupply(state: V5GameState, id: SupplyId, quantity: number) {
  const stack = state.fleet.supplies[id];
  const cost = removedCostBasis(stack, quantity);
  return {
    cost,
    supplies: {
      ...state.fleet.supplies,
      [id]: { quantity: stack.quantity - quantity, totalCostBasis: stack.totalCostBasis - cost },
    },
  };
}
export function departVoyage(
  content: WorldContent,
  state: V5GameState,
  routeId: string,
  now: number,
  seed: number,
): RuleResult {
  const route = content.getRoute(routeId);
  const eligibilityError = voyageDepartureError(content, state, routeId);
  if (eligibilityError) return { state, events: [], error: eligibilityError };
  if (!route) return { state, events: [], error: "This route is unavailable." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, events: [], error: "Departure time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, events: [], error: "A secure non-zero Voyage seed is required." };
  const { food, water } = route.requiredSupplies;
  const foodUse = consumeSupply(state, "food", food);
  const waterUse = consumeSupply({ ...state, fleet: { ...state.fleet, supplies: foodUse.supplies } }, "water", water);
  const voyage: Voyage = {
    id: `voyage-${route.id}-${now}`,
    routeId: route.id,
    originPortId: route.originPortId,
    destinationPortId: route.destinationPortId,
    departedAt: now,
    plannedArrivesAt: now + route.durationMilliseconds,
    staticRisk: route.staticRisk,
    requiredSupplies: route.requiredSupplies,
    supplyCost: foodUse.cost + waterUse.cost,
    seed,
  };
  return {
    state: {
      ...state,
      fleet: { ...state.fleet, supplies: waterUse.supplies },
      voyage,
    },
    events: [{ kind: "voyage-departed", at: now, voyageId: voyage.id, destinationPortId: route.destinationPortId }],
  };
}
export function voyageDepartureError(content: WorldContent, state: V5GameState, routeId: string): string | null {
  const route = content.getRoute(routeId);
  if (!route) return "This route is unavailable.";
  if (state.voyage) return "The Fleet is already on a Voyage.";
  if (route.originPortId !== state.fleet.locationPortId) return "The Fleet is not docked at this route's origin.";
  if (!state.world.knownPortIds.includes(route.destinationPortId)) return "This destination is still locked.";
  const { food, water } = route.requiredSupplies;
  if (state.fleet.supplies.food.quantity < food || state.fleet.supplies.water.quantity < water)
    return `Requires Food ${food} and Water ${water} before departure.`;
  return null;
}
export function voyageSupplyReadiness(content: WorldContent, state: V5GameState, routeId: string) {
  const route = content.getRoute(routeId);
  if (!route) return null;
  const { food, water } = route.requiredSupplies;
  return {
    food: {
      required: food,
      aboard: state.fleet.supplies.food.quantity,
      missing: Math.max(0, food - state.fleet.supplies.food.quantity),
    },
    water: {
      required: water,
      aboard: state.fleet.supplies.water.quantity,
      missing: Math.max(0, water - state.fleet.supplies.water.quantity),
    },
  };
}
export function resolveVoyage(content: WorldContent, state: V5GameState, now: number): RuleResult {
  const voyage = state.voyage;
  if (!voyage || now < voyage.plannedArrivesAt) return { state, events: [] };
  const arrival = settlePortEntry(content, { ...state, voyage: null }, voyage.destinationPortId, voyage.seed);
  let settledState = arrival.state;
  // Chronological: any restock outcome precedes arrival, so the renderer leaves
  // the arrival entry newest.
  const events: GameEvent[] = [];
  if (settledState.fleet.autoRestockOnArrival) {
    const plan = supplyRestockPlan(content, settledState);
    if (plan.totalQuantity > 0) {
      const restock = restockSupplies(content, settledState, voyage.plannedArrivesAt, {
        kind: "voyage-arrival",
        voyageId: voyage.id,
      });
      if (restock.error) {
        events.push({
          kind: "voyage-auto-restock-failed",
          at: voyage.plannedArrivesAt,
          voyageId: voyage.id,
          reason: restock.error,
        });
      } else {
        settledState = restock.state;
        events.push(...restock.events);
      }
    }
  }
  events.push({
    kind: "voyage-arrived",
    at: voyage.plannedArrivesAt,
    voyageId: voyage.id,
    destinationPortId: voyage.destinationPortId,
  });
  return {
    state: {
      ...settledState,
      voyage: null,
      latestVoyageResult: {
        voyageId: voyage.id,
        arrivedAt: voyage.plannedArrivesAt,
        destinationPortId: voyage.destinationPortId,
        sourceXpGained: arrival.xpGained,
        supplyCost: voyage.supplyCost,
      },
    },
    events,
  };
}
