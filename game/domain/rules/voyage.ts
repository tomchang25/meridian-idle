import { getRoute } from "@/game/domain/content/core-content";
import type { SupplyId, V5GameState, Voyage } from "@/game/domain/models/game";
import { removedCostBasis, type RuleResult } from "@/game/domain/rules/cargo";
import { settlePortEntry } from "@/game/domain/rules/progression";

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
export function departVoyage(state: V5GameState, routeId: string, now: number, seed: number): RuleResult {
  const route = getRoute(routeId);
  const eligibilityError = voyageDepartureError(state, routeId);
  if (eligibilityError) return { state, error: eligibilityError };
  if (!route) return { state, error: "This route is unavailable." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, error: "Departure time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, error: "A secure non-zero Voyage seed is required." };
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
      activity: [
        { id: voyage.id, at: now, message: `Departed for ${route.destinationPortId}.`, tone: "info" as const },
        ...state.activity,
      ].slice(0, 24),
    },
  };
}
export function voyageDepartureError(state: V5GameState, routeId: string): string | null {
  const route = getRoute(routeId);
  if (!route) return "This route is unavailable.";
  if (state.voyage) return "The Fleet is already on a Voyage.";
  if (route.originPortId !== state.fleet.locationPortId) return "The Fleet is not docked at this route's origin.";
  if (!state.world.knownPortIds.includes(route.destinationPortId)) return "This destination is still locked.";
  const { food, water } = route.requiredSupplies;
  if (state.fleet.supplies.food.quantity < food || state.fleet.supplies.water.quantity < water)
    return `Requires Food ${food} and Water ${water} before departure.`;
  return null;
}
export function resolveVoyage(state: V5GameState, now: number): RuleResult {
  const voyage = state.voyage;
  if (!voyage || now < voyage.plannedArrivesAt) return { state };
  const arrival = settlePortEntry({ ...state, voyage: null }, voyage.destinationPortId, voyage.seed);
  return {
    state: {
      ...arrival.state,
      voyage: null,
      latestVoyageResult: {
        voyageId: voyage.id,
        arrivedAt: voyage.plannedArrivesAt,
        destinationPortId: voyage.destinationPortId,
        sourceXpGained: arrival.xpGained,
        supplyCost: voyage.supplyCost,
      },
      activity: [
        {
          id: `${voyage.id}-arrived`,
          at: voyage.plannedArrivesAt,
          message: `Arrived at ${voyage.destinationPortId}.`,
          tone: "success" as const,
        },
        ...arrival.state.activity,
      ].slice(0, 24),
    },
  };
}
