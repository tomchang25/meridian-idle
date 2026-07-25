import type { NavEdge, WorldContent } from "@/core/content/world-content";
import { estimatePassage, planPassage, type PassageDenialReason } from "@/core/navigation/passage-planner";
import type {
  PassageEdgeSnapshot,
  PlannedPassageSnapshot,
  SupplyId,
  GameState,
  Voyage,
  VoyageSupplies,
} from "@/core/model/game";
import type { GameEvent } from "@/core/events/game-events";
import { removedCostBasis, restockSupplies, supplyRestockPlan, type RuleResult } from "@/core/rules/cargo";
import { settlePortEntry } from "@/core/rules/progression";

export type VoyagePassagePreview = {
  destinationPortId: string;
  quoteId: string | null;
  passage: PlannedPassageSnapshot | null;
  scheduledDurationMilliseconds: number | null;
  readiness: { food: SupplyReadiness; water: SupplyReadiness } | null;
  error: string | null;
};

type SupplyReadiness = { required: number; aboard: number; missing: number };

function consumeSupply(state: GameState, id: SupplyId, quantity: number) {
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

function denialMessage(reason: PassageDenialReason): string {
  switch (reason) {
    case "destination-unknown":
      return "This destination is still locked.";
    case "same-port":
      return "The Fleet is already docked at this destination.";
    case "invalid-speed":
      return "The Fleet has no valid sailing speed.";
    case "no-legal-path":
      return "No legal passage reaches this destination.";
    default:
      return "This destination is unavailable.";
  }
}

function validPacingMultiplier(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function scheduledDuration(plannedSailingDurationMilliseconds: number, pacingMultiplier: number): number {
  return Math.max(1, Math.round(plannedSailingDurationMilliseconds / pacingMultiplier));
}

function resolveEdgeTimeline(
  edges: readonly NavEdge[],
  content: WorldContent,
  speed: number,
  totalDurationMilliseconds: number,
): PassageEdgeSnapshot[] {
  let unroundedOffset = 0;
  return edges.map((edge, edgeIndex) => {
    const spans = edge.spans.map((span, spanIndex) => {
      unroundedOffset +=
        (span.distance / speed) * edge.traversalModifier * content.navigationConstants.timePerDistanceUnitMilliseconds;
      const isFinalBoundary = edgeIndex === edges.length - 1 && spanIndex === edge.spans.length - 1;
      return {
        subRegionId: span.subRegionId,
        simulationEndOffsetMilliseconds: isFinalBoundary ? totalDurationMilliseconds : Math.round(unroundedOffset),
      };
    });
    return {
      id: edge.id,
      originNodeId: edge.originNodeId,
      destinationNodeId: edge.destinationNodeId,
      simulationEndOffsetMilliseconds: spans[spans.length - 1]?.simulationEndOffsetMilliseconds ?? 0,
      staticRisk: edge.staticRisk,
      spans,
    };
  });
}

function cloneSnapshotEdges(edges: readonly PassageEdgeSnapshot[]): PassageEdgeSnapshot[] {
  return edges.map((edge) => ({ ...edge, spans: edge.spans.map((span) => ({ ...span })) }));
}

function quoteId(
  state: GameState,
  destinationPortId: string,
  passage: PlannedPassageSnapshot,
  scheduledDurationMilliseconds: number,
): string {
  return JSON.stringify({
    originPortId: state.fleet.locationPortId,
    destinationPortId,
    fleetSpeed: state.fleet.speed,
    knownPortIds: [...state.world.knownPortIds].sort(),
    supplies: {
      food: state.fleet.supplies.food.quantity,
      water: state.fleet.supplies.water.quantity,
    },
    edges: passage.edges.map((edge) => ({
      id: edge.id,
      simulationEndOffsetMilliseconds: edge.simulationEndOffsetMilliseconds,
      spans: edge.spans.map((span) => ({
        subRegionId: span.subRegionId,
        simulationEndOffsetMilliseconds: span.simulationEndOffsetMilliseconds,
      })),
    })),
    plannedSailingDurationMilliseconds: passage.plannedSailingDurationMilliseconds,
    scheduledDurationMilliseconds,
    pacingMultiplier: passage.pacingMultiplier,
  });
}

function supplyReadiness(state: GameState, required: VoyageSupplies) {
  const readinessFor = (id: "food" | "water"): SupplyReadiness => ({
    required: required[id],
    aboard: state.fleet.supplies[id].quantity,
    missing: Math.max(0, required[id] - state.fleet.supplies[id].quantity),
  });
  return { food: readinessFor("food"), water: readinessFor("water") };
}

/** Quotes a destination from canonical state without mutating it. */
export function previewVoyagePassage(
  content: WorldContent,
  state: GameState,
  destinationPortId: string,
  pacingMultiplier = 1,
): VoyagePassagePreview {
  if (state.voyage)
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      readiness: null,
      error: "The Fleet is already on a Voyage.",
    };
  if (!validPacingMultiplier(pacingMultiplier))
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      readiness: null,
      error: "Voyage pacing is invalid.",
    };

  const plan = planPassage({
    world: content,
    originPortId: state.fleet.locationPortId,
    destinationPortId,
    knownPortIds: state.world.knownPortIds,
    speed: state.fleet.speed,
  });
  if (plan.kind === "denied") {
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      readiness: null,
      error: denialMessage(plan.reason),
    };
  }

  const estimate = estimatePassage(plan, content, state.fleet.speed);
  const passage: PlannedPassageSnapshot = {
    kind: "planned",
    originPortId: plan.originPortId,
    destinationPortId: plan.destinationPortId,
    edges: resolveEdgeTimeline(estimate.edges, content, state.fleet.speed, estimate.durationMilliseconds),
    totalDistance: estimate.totalDistance,
    plannedSailingDurationMilliseconds: estimate.durationMilliseconds,
    pacingMultiplier,
    requiredSupplies: { ...estimate.requiredSupplies },
    staticRisk: estimate.staticRisk,
  };
  const scheduledDurationMilliseconds = scheduledDuration(passage.plannedSailingDurationMilliseconds, pacingMultiplier);
  const readiness = supplyReadiness(state, passage.requiredSupplies);
  const error =
    readiness.food.missing > 0 || readiness.water.missing > 0
      ? `Requires Food ${readiness.food.required} and Water ${readiness.water.required} before departure.`
      : null;
  return {
    destinationPortId,
    quoteId: quoteId(state, destinationPortId, passage, scheduledDurationMilliseconds),
    passage,
    scheduledDurationMilliseconds,
    readiness,
    error,
  };
}

export function voyageDepartureError(
  content: WorldContent,
  state: GameState,
  destinationPortId: string,
  pacingMultiplier = 1,
): string | null {
  return previewVoyagePassage(content, state, destinationPortId, pacingMultiplier).error;
}

export function departVoyage(
  content: WorldContent,
  state: GameState,
  destinationPortId: string,
  expectedQuoteId: string,
  now: number,
  seed: number,
  pacingMultiplier = 1,
): RuleResult {
  const preview = previewVoyagePassage(content, state, destinationPortId, pacingMultiplier);
  if (preview.error) return { state, events: [], error: preview.error };
  if (
    !preview.passage ||
    !preview.quoteId ||
    !preview.scheduledDurationMilliseconds ||
    preview.quoteId !== expectedQuoteId
  )
    return { state, events: [], error: "This passage quote is stale. Review the latest departure details." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, events: [], error: "Departure time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, events: [], error: "A secure non-zero Voyage seed is required." };

  const { food, water } = preview.passage.requiredSupplies;
  const foodUse = consumeSupply(state, "food", food);
  const waterUse = consumeSupply({ ...state, fleet: { ...state.fleet, supplies: foodUse.supplies } }, "water", water);
  const voyage: Voyage = {
    id: `voyage-${preview.passage.originPortId}-${preview.passage.destinationPortId}-${now}`,
    departedAt: now,
    plannedArrivesAt: now + preview.scheduledDurationMilliseconds,
    passage: { ...preview.passage, edges: cloneSnapshotEdges(preview.passage.edges) },
    supplyCost: foodUse.cost + waterUse.cost,
    seed,
  };
  return {
    state: { ...state, fleet: { ...state.fleet, supplies: waterUse.supplies }, voyage },
    events: [
      { kind: "voyage-departed", at: now, voyageId: voyage.id, destinationPortId: voyage.passage.destinationPortId },
    ],
  };
}

export function resolveVoyage(content: WorldContent, state: GameState, now: number): RuleResult {
  const voyage = state.voyage;
  if (!voyage || now < voyage.plannedArrivesAt) return { state, events: [] };
  const arrival = settlePortEntry(content, { ...state, voyage: null }, voyage.passage.destinationPortId, voyage.seed);
  let settledState = arrival.state;
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
    destinationPortId: voyage.passage.destinationPortId,
  });
  return {
    state: {
      ...settledState,
      voyage: null,
      latestVoyageResult: {
        voyageId: voyage.id,
        arrivedAt: voyage.plannedArrivesAt,
        destinationPortId: voyage.passage.destinationPortId,
        sourceXpGained: arrival.xpGained,
        supplyCost: voyage.supplyCost,
      },
    },
    events,
  };
}
