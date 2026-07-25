import type { NavEdge, WorldContent } from "@/core/content/world-content";
import {
  estimatePassage,
  planPassage,
  SUPPLY_CONSUMPTION_SCALE,
  type PassageDenialReason,
} from "@/core/navigation/passage-planner";
import type {
  PassageEdgeSnapshot,
  PlannedPassageSnapshot,
  SupplyId,
  GameState,
  Voyage,
  VoyagePosition,
  VoyageProgress,
  VoyageSupplies,
  SailingSupplyLedger,
} from "@/core/model/game";
import type { GameEvent } from "@/core/events/game-events";
import { removedCostBasis, restockSupplies, supplyRestockPlan, type RuleResult } from "@/core/rules/cargo";
import { settlePortEntry } from "@/core/rules/progression";

const SUPPLY_UNIT_THRESHOLD = SUPPLY_CONSUMPTION_SCALE * 1_000;

export type VoyagePassagePreview = {
  destinationPortId: string;
  quoteId: string | null;
  passage: PlannedPassageSnapshot | null;
  scheduledDurationMilliseconds: number | null;
  supplyConsumptionMicroUnitsPerSecond: VoyageSupplies | null;
  readiness: { food: SupplyReadiness; water: SupplyReadiness } | null;
  error: string | null;
};

type SupplyReadiness = { required: number; aboard: number; missing: number };
type SpanBoundary = { edge: PassageEdgeSnapshot; edgeIndex: number; spanIndex: number; offset: number };

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
  supplyConsumptionMicroUnitsPerSecond: VoyageSupplies,
): string {
  return JSON.stringify({
    originPortId: state.fleet.holdingNavPointId ?? state.fleet.locationPortId,
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
    supplyConsumptionMicroUnitsPerSecond,
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

function spanBoundaries(passage: PlannedPassageSnapshot): SpanBoundary[] {
  return passage.edges.flatMap((edge, edgeIndex) =>
    edge.spans.map((span, spanIndex) => ({ edge, edgeIndex, spanIndex, offset: span.simulationEndOffsetMilliseconds })),
  );
}

function positionAtOffset(passage: PlannedPassageSnapshot, offset: number): VoyagePosition {
  if (offset <= 0) return { kind: "node", nodeId: passage.originPortId };
  for (const edge of passage.edges) {
    if (offset < edge.simulationEndOffsetMilliseconds)
      return {
        kind: "edge",
        edgeId: edge.id,
        originNodeId: edge.originNodeId,
        destinationNodeId: edge.destinationNodeId,
        simulationOffsetMilliseconds: offset,
      };
    if (offset === edge.simulationEndOffsetMilliseconds) return { kind: "node", nodeId: edge.destinationNodeId };
  }
  return { kind: "node", nodeId: passage.destinationPortId };
}

function completedSpanCount(passage: PlannedPassageSnapshot, offset: number): number {
  return spanBoundaries(passage).filter((boundary) => boundary.offset <= offset).length;
}

function completedEdgeCount(passage: PlannedPassageSnapshot, offset: number): number {
  return passage.edges.filter((edge) => edge.simulationEndOffsetMilliseconds <= offset).length;
}

function scheduledBoundaryAt(voyage: Voyage, simulationOffsetMilliseconds: number): number {
  const total = voyage.passage.plannedSailingDurationMilliseconds;
  if (simulationOffsetMilliseconds >= total) return voyage.plannedArrivesAt;
  const scheduled = voyage.plannedArrivesAt - voyage.departedAt;
  return Math.min(
    voyage.plannedArrivesAt,
    voyage.departedAt + Math.ceil((simulationOffsetMilliseconds * scheduled) / total),
  );
}

function simulationOffsetAt(voyage: Voyage, now: number): number {
  if (now <= voyage.departedAt) return 0;
  const total = voyage.passage.plannedSailingDurationMilliseconds;
  if (now >= voyage.plannedArrivesAt) return total;
  const scheduled = voyage.plannedArrivesAt - voyage.departedAt;
  return Math.min(total, Math.floor(((now - voyage.departedAt) * total) / scheduled));
}

function nextSupplyOffset(progress: VoyageProgress, id: "food" | "water"): number | null {
  if (progress.kind !== "planned" || progress.supplyLedger.accountingMode !== "accruing") return null;
  const rate = progress.supplyLedger.supplyConsumptionMicroUnitsPerSecond[id];
  if (rate <= 0) return null;
  const remainder = progress.supplyLedger.remainderMicroUnitMilliseconds[id];
  const delta = Math.ceil((SUPPLY_UNIT_THRESHOLD - remainder) / rate);
  return progress.resolvedSimulationOffsetMilliseconds + Math.max(1, delta);
}

function nextBoundaryOffset(passage: PlannedPassageSnapshot, progress: VoyageProgress): number {
  const current = progress.resolvedSimulationOffsetMilliseconds;
  const nextSpan = spanBoundaries(passage).find((boundary) => boundary.offset > current)?.offset;
  const candidates = [
    nextSpan,
    nextSupplyOffset(progress, "food"),
    nextSupplyOffset(progress, "water"),
    passage.plannedSailingDurationMilliseconds,
  ]
    .filter((offset): offset is number => offset !== null && offset !== undefined)
    .filter((offset) => offset > current);
  return Math.min(...candidates);
}

function plannedProgressAt(
  passage: PlannedPassageSnapshot,
  voyage: Pick<Voyage, "departedAt" | "plannedArrivesAt" | "passage">,
  offset: number,
  ledger: SailingSupplyLedger,
): VoyageProgress {
  const provisional: Voyage = {
    ...voyage,
    id: "boundary",
    passage,
    progress: undefined as never,
    supplyCost: 0,
    seed: 1,
  };
  const progress: VoyageProgress = {
    kind: "planned",
    resolvedAt: scheduledBoundaryAt(provisional, offset),
    resolvedSimulationOffsetMilliseconds: offset,
    completedSpanCount: completedSpanCount(passage, offset),
    completedEdgeCount: completedEdgeCount(passage, offset),
    position: positionAtOffset(passage, offset),
    nextBoundaryAt: provisional.plannedArrivesAt,
    supplyLedger: ledger,
  };
  return { ...progress, nextBoundaryAt: scheduledBoundaryAt(provisional, nextBoundaryOffset(passage, progress)) };
}

function initialProgress(
  passage: PlannedPassageSnapshot,
  departedAt: number,
  plannedArrivesAt: number,
  supplyConsumptionMicroUnitsPerSecond: VoyageSupplies,
): VoyageProgress {
  return plannedProgressAt(passage, { departedAt, plannedArrivesAt, passage }, 0, {
    accountingMode: "accruing",
    consumedSupplies: { food: 0, water: 0 },
    remainderMicroUnitMilliseconds: { food: 0, water: 0 },
    supplyConsumptionMicroUnitsPerSecond,
  });
}

function consumeSupplyUnits(
  state: GameState,
  id: SupplyId,
  quantity: number,
): { state: GameState; cost: number } | null {
  let nextState = state;
  let cost = 0;
  for (let index = 0; index < quantity; index += 1) {
    const stack = nextState.fleet.supplies[id];
    if (stack.quantity < 1) return null;
    const unitCost = removedCostBasis(stack, 1);
    cost += unitCost;
    nextState = {
      ...nextState,
      fleet: {
        ...nextState.fleet,
        supplies: {
          ...nextState.fleet.supplies,
          [id]: { quantity: stack.quantity - 1, totalCostBasis: stack.totalCostBasis - unitCost },
        },
      },
    };
  }
  return { state: nextState, cost };
}

function accrueSupplyLedger(ledger: SailingSupplyLedger, deltaSimulationMilliseconds: number) {
  if (ledger.accountingMode === "prepaid") return { ledger, foodUnits: 0, waterUnits: 0 };
  const accrue = (id: "food" | "water") => {
    const total =
      ledger.remainderMicroUnitMilliseconds[id] +
      deltaSimulationMilliseconds * ledger.supplyConsumptionMicroUnitsPerSecond[id];
    return { units: Math.floor(total / SUPPLY_UNIT_THRESHOLD), remainder: total % SUPPLY_UNIT_THRESHOLD };
  };
  const food = accrue("food");
  const water = accrue("water");
  return {
    foodUnits: food.units,
    waterUnits: water.units,
    ledger: {
      ...ledger,
      consumedSupplies: {
        food: ledger.consumedSupplies.food + food.units,
        water: ledger.consumedSupplies.water + water.units,
      },
      remainderMicroUnitMilliseconds: { food: food.remainder, water: water.remainder },
    },
  };
}

function settleFinalSupplyLedger(ledger: SailingSupplyLedger, requiredSupplies: VoyageSupplies) {
  if (ledger.accountingMode === "prepaid") return { ledger, foodUnits: 0, waterUnits: 0 };
  const foodUnits = requiredSupplies.food - ledger.consumedSupplies.food;
  const waterUnits = requiredSupplies.water - ledger.consumedSupplies.water;
  if (foodUnits < 0 || waterUnits < 0) return null;
  return {
    foodUnits,
    waterUnits,
    ledger: {
      ...ledger,
      consumedSupplies: { ...requiredSupplies },
      remainderMicroUnitMilliseconds: { food: 0, water: 0 },
    },
  };
}

function updateVoyageAfterBoundary(
  state: GameState,
  voyage: Voyage,
  offset: number,
): { state: GameState; voyage: Voyage } | null {
  if (voyage.passage.kind !== "planned" || voyage.progress.kind !== "planned") return null;
  const delta = offset - voyage.progress.resolvedSimulationOffsetMilliseconds;
  const accrued = accrueSupplyLedger(voyage.progress.supplyLedger, delta);
  let nextState = state;
  const food = consumeSupplyUnits(nextState, "food", accrued.foodUnits);
  if (!food) return null;
  nextState = food.state;
  const water = consumeSupplyUnits(nextState, "water", accrued.waterUnits);
  if (!water) return null;
  nextState = water.state;
  const progress = plannedProgressAt(voyage.passage, voyage, offset, accrued.ledger);
  const nextVoyage = { ...voyage, progress, supplyCost: voyage.supplyCost + food.cost + water.cost };
  return { state: { ...nextState, voyage: nextVoyage }, voyage: nextVoyage };
}

function finalizeVoyage(content: WorldContent, state: GameState, voyage: Voyage): RuleResult {
  let workingState = state;
  let completedVoyage = voyage;
  if (voyage.passage.kind === "planned" && voyage.progress.kind === "planned") {
    const finalLedger = settleFinalSupplyLedger(voyage.progress.supplyLedger, voyage.passage.requiredSupplies);
    if (!finalLedger) return { state, events: [], error: "Voyage Supply accounting is invalid." };
    const food = consumeSupplyUnits(workingState, "food", finalLedger.foodUnits);
    if (!food) return { state, events: [], error: "Voyage Food accounting is unavailable." };
    workingState = food.state;
    const water = consumeSupplyUnits(workingState, "water", finalLedger.waterUnits);
    if (!water) return { state, events: [], error: "Voyage Water accounting is unavailable." };
    workingState = water.state;
    const progress = plannedProgressAt(
      voyage.passage,
      voyage,
      voyage.passage.plannedSailingDurationMilliseconds,
      finalLedger.ledger,
    );
    completedVoyage = { ...voyage, progress, supplyCost: voyage.supplyCost + food.cost + water.cost };
    workingState = { ...workingState, voyage: completedVoyage };
  }
  const heldPoint = content.getNavPoint(completedVoyage.passage.destinationPortId);
  if (heldPoint?.canHoldPosition) {
    return {
      state: {
        ...workingState,
        voyage: null,
        fleet: {
          ...workingState.fleet,
          holdingNavPointId: heldPoint.id,
          holdingOriginNodeId: completedVoyage.passage.originPortId,
        },
      },
      events: [
        {
          kind: "voyage-reached-nav-point",
          at: completedVoyage.plannedArrivesAt,
          voyageId: completedVoyage.id,
          navPointId: heldPoint.id,
        },
      ],
    };
  }
  const arrival = settlePortEntry(
    content,
    { ...workingState, voyage: null },
    completedVoyage.passage.destinationPortId,
    completedVoyage.seed,
  );
  let settledState = arrival.state;
  const events: GameEvent[] = [];
  if (settledState.fleet.autoRestockOnArrival) {
    const plan = supplyRestockPlan(content, settledState);
    if (plan.totalQuantity > 0) {
      const restock = restockSupplies(content, settledState, completedVoyage.plannedArrivesAt, {
        kind: "voyage-arrival",
        voyageId: completedVoyage.id,
      });
      if (restock.error) {
        events.push({
          kind: "voyage-auto-restock-failed",
          at: completedVoyage.plannedArrivesAt,
          voyageId: completedVoyage.id,
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
    at: completedVoyage.plannedArrivesAt,
    voyageId: completedVoyage.id,
    destinationPortId: completedVoyage.passage.destinationPortId,
  });
  return {
    state: {
      ...settledState,
      voyage: null,
      latestVoyageResult: {
        voyageId: completedVoyage.id,
        arrivedAt: completedVoyage.plannedArrivesAt,
        destinationPortId: completedVoyage.passage.destinationPortId,
        sourceXpGained: arrival.xpGained,
        supplyCost: completedVoyage.supplyCost,
      },
    },
    events,
  };
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
      supplyConsumptionMicroUnitsPerSecond: null,
      readiness: null,
      error: "The Fleet is already on a Voyage.",
    };
  if (!validPacingMultiplier(pacingMultiplier))
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      supplyConsumptionMicroUnitsPerSecond: null,
      readiness: null,
      error: "Voyage pacing is invalid.",
    };

  const destinationPoint = content.getNavPoint(destinationPortId);
  if (destinationPoint && !destinationPoint.canHoldPosition)
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      supplyConsumptionMicroUnitsPerSecond: null,
      readiness: null,
      error: "This Navigation Point cannot be used as a holding position.",
    };
  if (state.fleet.holdingNavPointId && destinationPoint)
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      supplyConsumptionMicroUnitsPerSecond: null,
      readiness: null,
      error: "Choose a known Port for the next Passage.",
    };
  const plan = planPassage({
    world: content,
    originPortId: state.fleet.holdingNavPointId ?? state.fleet.locationPortId,
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
      supplyConsumptionMicroUnitsPerSecond: null,
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
    quoteId: quoteId(
      state,
      destinationPortId,
      passage,
      scheduledDurationMilliseconds,
      estimate.supplyConsumptionMicroUnitsPerSecond,
    ),
    passage,
    scheduledDurationMilliseconds,
    supplyConsumptionMicroUnitsPerSecond: estimate.supplyConsumptionMicroUnitsPerSecond,
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
    !preview.supplyConsumptionMicroUnitsPerSecond ||
    preview.quoteId !== expectedQuoteId
  )
    return { state, events: [], error: "This passage quote is stale. Review the latest departure details." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, events: [], error: "Departure time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, events: [], error: "A secure non-zero Voyage seed is required." };

  const plannedArrivesAt = now + preview.scheduledDurationMilliseconds;
  const voyageBase = {
    id: `voyage-${preview.passage.originPortId}-${preview.passage.destinationPortId}-${now}`,
    departedAt: now,
    plannedArrivesAt,
    passage: { ...preview.passage, edges: cloneSnapshotEdges(preview.passage.edges) },
    supplyCost: 0,
    seed,
  };
  const voyage: Voyage = {
    ...voyageBase,
    progress: initialProgress(voyageBase.passage, now, plannedArrivesAt, preview.supplyConsumptionMicroUnitsPerSecond),
  };
  return {
    state: { ...state, voyage },
    events: [
      { kind: "voyage-departed", at: now, voyageId: voyage.id, destinationPortId: voyage.passage.destinationPortId },
    ],
  };
}

export function resolvedVoyageSubRegionId(voyage: Voyage): string | null {
  if (voyage.passage.kind !== "planned" || voyage.progress.kind !== "planned") return null;
  const offset = voyage.progress.resolvedSimulationOffsetMilliseconds;
  return (
    spanBoundaries(voyage.passage)
      .find((boundary) => boundary.offset >= offset)
      ?.edge.spans.find((span) => span.simulationEndOffsetMilliseconds >= offset)?.subRegionId ?? null
  );
}

export function resolveVoyage(content: WorldContent, state: GameState, now: number): RuleResult {
  const voyage = state.voyage;
  if (!voyage || now < voyage.progress.resolvedAt) return { state, events: [] };
  const targetOffset = simulationOffsetAt(voyage, now);
  if (targetOffset < voyage.progress.resolvedSimulationOffsetMilliseconds) return { state, events: [] };
  if (voyage.passage.kind === "legacy-route" || voyage.progress.kind === "legacy-route")
    return targetOffset >= voyage.passage.plannedSailingDurationMilliseconds
      ? finalizeVoyage(content, state, voyage)
      : { state, events: [] };

  if (voyage.passage.kind !== "planned" || voyage.progress.kind !== "planned") return { state, events: [] };
  let workingState = state;
  let workingVoyage = voyage;
  while (workingVoyage.passage.kind === "planned" && workingVoyage.progress.kind === "planned") {
    const nextOffset = nextBoundaryOffset(workingVoyage.passage, workingVoyage.progress);
    if (nextOffset > targetOffset) break;
    const resolved = updateVoyageAfterBoundary(workingState, workingVoyage, nextOffset);
    if (!resolved) return { state, events: [], error: "Voyage Supply accounting is unavailable." };
    workingState = resolved.state;
    workingVoyage = resolved.voyage;
    if (nextOffset >= workingVoyage.passage.plannedSailingDurationMilliseconds)
      return finalizeVoyage(content, workingState, workingVoyage);
  }
  return { state: workingState, events: [] };
}
