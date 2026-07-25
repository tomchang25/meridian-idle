import type { NavEdge, WorldContent } from "@/core/content/world-content";

export const SUPPLY_CONSUMPTION_SCALE = 1_000_000;

export type PassageDenialReason =
  | "origin-unknown-node"
  | "destination-unknown-node"
  | "destination-unknown"
  | "same-port"
  | "invalid-speed"
  | "no-legal-path";

export type PassagePlan = {
  kind: "planned";
  originPortId: string;
  destinationPortId: string;
  edges: readonly NavEdge[];
  totalDistance: number;
  unroundedDurationMilliseconds: number;
};

export type PassageDenial = {
  kind: "denied";
  originPortId: string;
  destinationPortId: string;
  reason: PassageDenialReason;
};

export type PassagePlannerInput = {
  world: WorldContent;
  originPortId: string;
  destinationPortId: string;
  knownPortIds: readonly string[];
  speed: number;
  /** Seam for the future Region-unlock and dynamic-condition legality rules. */
  canTraverseEdge?: (edge: NavEdge) => boolean;
};

export type PassageQuote = PassagePlan & {
  durationMilliseconds: number;
  debugDurationMilliseconds: number;
  requiredSupplies: { food: number; water: number };
  supplyConsumptionMicroUnitsPerSecond: { food: number; water: number };
  staticRisk: number;
};

function fixedPointRate(unitsPerSecond: number): number {
  return Math.round(unitsPerSecond * SUPPLY_CONSUMPTION_SCALE);
}

function requiredSupply(durationMilliseconds: number, microUnitsPerSecond: number): number {
  return Math.ceil((durationMilliseconds * microUnitsPerSecond) / (1_000 * SUPPLY_CONSUMPTION_SCALE));
}

type Candidate = PassagePlan & { edgeIds: readonly string[] };

function compareEdgeIdSequences(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const comparison = left[index].localeCompare(right[index]);
    if (comparison !== 0) return comparison;
  }
  return left.length - right.length;
}

function compareCandidates(left: Candidate, right: Candidate): number {
  if (left.unroundedDurationMilliseconds !== right.unroundedDurationMilliseconds)
    return left.unroundedDurationMilliseconds - right.unroundedDurationMilliseconds;
  if (left.totalDistance !== right.totalDistance) return left.totalDistance - right.totalDistance;
  return compareEdgeIdSequences(left.edgeIds, right.edgeIds);
}

function isLegalTraversal(edge: NavEdge, input: PassagePlannerInput): boolean {
  if (!(edge.distance > 0) || !(edge.traversalModifier > 0)) return false;
  if (input.canTraverseEdge && !input.canTraverseEdge(edge)) return false;
  const destinationIsPort = input.world.getPort(edge.destinationNodeId) !== undefined;
  return !destinationIsPort || edge.destinationNodeId === input.destinationPortId;
}

/**
 * Finds the deterministic least-cost graph path. Port nodes are terminal: only
 * the requested origin and destination may appear in a passage.
 */
export function planPassage(input: PassagePlannerInput): PassagePlan | PassageDenial {
  if (!input.world.getPort(input.originPortId) && !input.world.getNavPoint(input.originPortId))
    return {
      kind: "denied",
      originPortId: input.originPortId,
      destinationPortId: input.destinationPortId,
      reason: "origin-unknown-node",
    };
  const destinationPoint = input.world.getNavPoint(input.destinationPortId);
  if (!input.world.getPort(input.destinationPortId) && !destinationPoint)
    return {
      kind: "denied",
      originPortId: input.originPortId,
      destinationPortId: input.destinationPortId,
      reason: "destination-unknown-node",
    };
  if (input.originPortId === input.destinationPortId)
    return {
      kind: "denied",
      originPortId: input.originPortId,
      destinationPortId: input.destinationPortId,
      reason: "same-port",
    };
  if (!(input.speed > 0))
    return {
      kind: "denied",
      originPortId: input.originPortId,
      destinationPortId: input.destinationPortId,
      reason: "invalid-speed",
    };
  const knownDestinationPortId = input.world.getPort(input.destinationPortId)
    ? input.destinationPortId
    : destinationPoint?.harborPortId;
  if (knownDestinationPortId && !input.knownPortIds.includes(knownDestinationPortId))
    return {
      kind: "denied",
      originPortId: input.originPortId,
      destinationPortId: input.destinationPortId,
      reason: "destination-unknown",
    };

  const initial: Candidate = {
    kind: "planned",
    originPortId: input.originPortId,
    destinationPortId: input.destinationPortId,
    edges: [],
    edgeIds: [],
    totalDistance: 0,
    unroundedDurationMilliseconds: 0,
  };
  const pending: Candidate[] = [initial];
  const bestByNode = new Map<string, Candidate>([[input.originPortId, initial]]);

  while (pending.length > 0) {
    pending.sort(compareCandidates);
    const current = pending.shift()!;
    const currentNodeId =
      current.edges.length > 0 ? current.edges[current.edges.length - 1].destinationNodeId : input.originPortId;
    if (bestByNode.get(currentNodeId) !== current) continue;
    if (currentNodeId === input.destinationPortId) return current;

    const edges = [...input.world.getOutgoingNavEdges(currentNodeId)].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    for (const edge of edges) {
      if (!isLegalTraversal(edge, input)) continue;
      const unroundedDurationMilliseconds =
        current.unroundedDurationMilliseconds +
        (edge.distance / input.speed) *
          edge.traversalModifier *
          input.world.navigationConstants.timePerDistanceUnitMilliseconds;
      const next: Candidate = {
        kind: "planned",
        originPortId: input.originPortId,
        destinationPortId: input.destinationPortId,
        edges: [...current.edges, edge],
        edgeIds: [...current.edgeIds, edge.id],
        totalDistance: current.totalDistance + edge.distance,
        unroundedDurationMilliseconds,
      };
      const prior = bestByNode.get(edge.destinationNodeId);
      if (!prior || compareCandidates(next, prior) < 0) {
        bestByNode.set(edge.destinationNodeId, next);
        pending.push(next);
      }
    }
  }

  return {
    kind: "denied",
    originPortId: input.originPortId,
    destinationPortId: input.destinationPortId,
    reason: "no-legal-path",
  };
}

/** Estimates the already-planned passage against the caller's canonical Fleet speed. */
export function estimatePassage(plan: PassagePlan, world: WorldContent, speed: number): PassageQuote {
  if (!(speed > 0)) throw new RangeError("Fleet speed must be greater than zero.");
  const unroundedDurationMilliseconds = plan.edges.reduce(
    (total, edge) =>
      total +
      (edge.distance / speed) * edge.traversalModifier * world.navigationConstants.timePerDistanceUnitMilliseconds,
    0,
  );
  const durationMilliseconds = Math.round(unroundedDurationMilliseconds);
  const { food, water } = world.navigationConstants.supplyConsumptionPerSecond;
  const supplyConsumptionMicroUnitsPerSecond = { food: fixedPointRate(food), water: fixedPointRate(water) };

  return {
    ...plan,
    unroundedDurationMilliseconds,
    durationMilliseconds,
    debugDurationMilliseconds: durationMilliseconds / world.navigationConstants.debugTimeScale,
    requiredSupplies: {
      food: requiredSupply(durationMilliseconds, supplyConsumptionMicroUnitsPerSecond.food),
      water: requiredSupply(durationMilliseconds, supplyConsumptionMicroUnitsPerSecond.water),
    },
    supplyConsumptionMicroUnitsPerSecond,
    staticRisk: 1 - plan.edges.reduce((remaining, edge) => remaining * (1 - edge.staticRisk), 1),
  };
}
