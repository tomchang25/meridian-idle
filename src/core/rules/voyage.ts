import type { NavEdge, NavEdgeSpan, WorldContent } from "@/core/content/world-content";
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
      return "The Fleet is already at this destination.";
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
  remainderMicroUnitMilliseconds: VoyageSupplies = { food: 0, water: 0 },
): VoyageProgress {
  return plannedProgressAt(passage, { departedAt, plannedArrivesAt, passage }, 0, {
    accountingMode: "accruing",
    consumedSupplies: { food: 0, water: 0 },
    remainderMicroUnitMilliseconds,
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

/** Settles a Voyage at a node it actually reached: holds at any non-Port node, or invokes Port entry settlement. */
function arriveAtNode(
  content: WorldContent,
  state: GameState,
  nodeId: string,
  originNodeId: string,
  arrivedAt: number,
  voyageId: string,
  seed: number,
  supplyCost: number,
): RuleResult {
  const heldPoint = content.getNavPoint(nodeId);
  if (heldPoint) {
    return {
      state: {
        ...state,
        voyage: null,
        fleet: { ...state.fleet, holdingNavPointId: heldPoint.id, holdingOriginNodeId: originNodeId },
      },
      events: [{ kind: "voyage-reached-nav-point", at: arrivedAt, voyageId, navPointId: heldPoint.id }],
    };
  }
  const arrival = settlePortEntry(content, { ...state, voyage: null }, nodeId, seed);
  let settledState = arrival.state;
  const events: GameEvent[] = [];
  if (settledState.fleet.autoRestockOnArrival) {
    const plan = supplyRestockPlan(content, settledState);
    if (plan.totalQuantity > 0) {
      const restock = restockSupplies(content, settledState, arrivedAt, { kind: "voyage-arrival", voyageId });
      if (restock.error) {
        events.push({ kind: "voyage-auto-restock-failed", at: arrivedAt, voyageId, reason: restock.error });
      } else {
        settledState = restock.state;
        events.push(...restock.events);
      }
    }
  }
  events.push({ kind: "voyage-arrived", at: arrivedAt, voyageId, destinationPortId: nodeId });
  return {
    state: {
      ...settledState,
      voyage: null,
      latestVoyageResult: {
        voyageId,
        arrivedAt,
        destinationPortId: nodeId,
        sourceXpGained: arrival.xpGained,
        supplyCost,
      },
    },
    events,
  };
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
  return arriveAtNode(
    content,
    workingState,
    completedVoyage.passage.destinationPortId,
    completedVoyage.passage.originPortId,
    completedVoyage.plannedArrivesAt,
    completedVoyage.id,
    completedVoyage.seed,
    completedVoyage.supplyCost,
  );
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
  if (destinationPoint && !destinationPoint.isChartDestination)
    return {
      destinationPortId,
      quoteId: null,
      passage: null,
      scheduledDurationMilliseconds: null,
      supplyConsumptionMicroUnitsPerSecond: null,
      readiness: null,
      error: "This Navigation Point cannot be selected as a Passage destination.",
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
    departedMidEdge: false,
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
    state: { ...state, voyage, fleet: { ...state.fleet, holdingNavPointId: null, holdingOriginNodeId: null } },
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

// --- Break-off -------------------------------------------------------------

export type BreakOffExitId = "prior" | "next";

export type BreakOffExitOption = {
  exit: BreakOffExitId;
  nodeId: string;
  quoteId: string | null;
  passage: PlannedPassageSnapshot | null;
  scheduledDurationMilliseconds: number | null;
  supplyConsumptionMicroUnitsPerSecond: VoyageSupplies | null;
  readiness: { food: SupplyReadiness; water: SupplyReadiness } | null;
  error: string | null;
};

export type BreakOffPreview =
  | { kind: "unavailable"; error: string }
  | { kind: "at-node"; nodeId: string; quoteId: string }
  | { kind: "mid-edge"; prior: BreakOffExitOption; next: BreakOffExitOption };

const BREAK_OFF_UNAVAILABLE_MESSAGE = "Break-off is unavailable for this Voyage.";

function splitEdgeSpans(
  spans: readonly NavEdgeSpan[],
  travelDistance: number,
): { traveled: NavEdgeSpan[]; remaining: NavEdgeSpan[] } {
  const traveled: NavEdgeSpan[] = [];
  const remaining: NavEdgeSpan[] = [];
  let consumed = 0;
  for (const span of spans) {
    const spanStart = consumed;
    const spanEnd = consumed + span.distance;
    if (spanEnd <= travelDistance) traveled.push({ ...span });
    else if (spanStart >= travelDistance) remaining.push({ ...span });
    else {
      const traveledPart = travelDistance - spanStart;
      traveled.push({ subRegionId: span.subRegionId, distance: traveledPart });
      remaining.push({ subRegionId: span.subRegionId, distance: span.distance - traveledPart });
    }
    consumed = spanEnd;
  }
  return { traveled, remaining };
}

type ResolvedBreakOffPosition = { resolvedState: GameState; resolvedVoyage: Voyage };

function resolveBreakOffPosition(
  content: WorldContent,
  state: GameState,
  now: number,
): ResolvedBreakOffPosition | { error: string } {
  const voyage = state.voyage;
  if (!voyage) return { error: "The Fleet is not underway." };
  if (voyage.passage.kind !== "planned" || voyage.progress.kind !== "planned")
    return { error: BREAK_OFF_UNAVAILABLE_MESSAGE };
  if (voyage.progress.supplyLedger.accountingMode !== "accruing") return { error: BREAK_OFF_UNAVAILABLE_MESSAGE };
  const targetOffset = Math.max(voyage.progress.resolvedSimulationOffsetMilliseconds, simulationOffsetAt(voyage, now));
  if (targetOffset >= voyage.passage.plannedSailingDurationMilliseconds)
    return { error: "The Voyage has already arrived; resolve arrival before breaking off." };
  const resolved = updateVoyageAfterBoundary(state, voyage, targetOffset);
  if (!resolved) return { error: "Voyage Supply accounting is unavailable." };
  return { resolvedState: resolved.state, resolvedVoyage: resolved.voyage };
}

/**
 * Identifies the decision the player is confirming — this Voyage, this exit
 * direction, this exit node — rather than the connector geometry it produces.
 * The Fleet moves continuously while the panel is on screen, so binding the
 * quote to a derived distance would reject almost every real click; binding it
 * to the exit node still rejects a confirmation that crossed an edge boundary
 * and now means a different destination.
 */
function breakOffQuoteId(
  state: GameState,
  voyage: Voyage,
  exit: BreakOffExitId,
  exitNodeId: string,
  pacingMultiplier: number,
): string {
  return JSON.stringify({
    voyageId: voyage.id,
    exit,
    exitNodeId,
    fleetSpeed: state.fleet.speed,
    supplies: { food: state.fleet.supplies.food.quantity, water: state.fleet.supplies.water.quantity },
    pacingMultiplier,
  });
}

function unavailableOption(exit: BreakOffExitId, nodeId: string, error: string): BreakOffExitOption {
  return {
    exit,
    nodeId,
    quoteId: null,
    passage: null,
    scheduledDurationMilliseconds: null,
    supplyConsumptionMicroUnitsPerSecond: null,
    readiness: null,
    error,
  };
}

function buildBreakOffOption(
  content: WorldContent,
  resolvedState: GameState,
  resolvedVoyage: Voyage,
  exit: BreakOffExitId,
  pacingMultiplier: number,
): BreakOffExitOption {
  const passage = resolvedVoyage.passage as PlannedPassageSnapshot;
  const position = (resolvedVoyage.progress as Extract<VoyageProgress, { kind: "planned" }>).position as Extract<
    VoyagePosition,
    { kind: "edge" }
  >;
  const edgeIndex = passage.edges.findIndex((edge) => edge.id === position.edgeId);
  const edge = passage.edges[edgeIndex];
  if (!edge) return unavailableOption(exit, position.destinationNodeId, BREAK_OFF_UNAVAILABLE_MESSAGE);
  const rawEdge = content.getNavEdge(edge.id);
  if (!rawEdge)
    return unavailableOption(
      exit,
      exit === "next" ? edge.destinationNodeId : edge.originNodeId,
      BREAK_OFF_UNAVAILABLE_MESSAGE,
    );

  const edgeStartOffset = edgeIndex === 0 ? 0 : passage.edges[edgeIndex - 1].simulationEndOffsetMilliseconds;
  const edgeEndOffset = edge.simulationEndOffsetMilliseconds;
  const traveledFraction =
    (position.simulationOffsetMilliseconds - edgeStartOffset) / (edgeEndOffset - edgeStartOffset);
  const traveledDistance = Math.round(rawEdge.distance * traveledFraction);
  const remainingDistance = rawEdge.distance - traveledDistance;

  let originNodeId: string;
  let destinationNodeId: string;
  let syntheticEdge: NavEdge;
  if (exit === "next") {
    originNodeId = rawEdge.originNodeId;
    destinationNodeId = rawEdge.destinationNodeId;
    if (remainingDistance <= 0)
      return unavailableOption(exit, destinationNodeId, "The Fleet has already reached this node.");
    syntheticEdge = {
      id: `${rawEdge.id}-break-off-next`,
      corridorId: rawEdge.corridorId,
      originNodeId,
      destinationNodeId,
      distance: remainingDistance,
      staticRisk: rawEdge.staticRisk * (remainingDistance / rawEdge.distance),
      traversalModifier: rawEdge.traversalModifier,
      spans: splitEdgeSpans(rawEdge.spans, traveledDistance).remaining,
    };
  } else {
    originNodeId = rawEdge.destinationNodeId;
    destinationNodeId = rawEdge.originNodeId;
    if (traveledDistance <= 0)
      return unavailableOption(exit, destinationNodeId, "The Fleet has not yet left this node.");
    const reverseEdge = content
      .getOutgoingNavEdges(rawEdge.destinationNodeId)
      .find(
        (candidate) =>
          candidate.corridorId === rawEdge.corridorId && candidate.destinationNodeId === rawEdge.originNodeId,
      );
    if (!reverseEdge) return unavailableOption(exit, destinationNodeId, "No legal passage returns to this node.");
    syntheticEdge = {
      id: `${rawEdge.id}-break-off-prior`,
      corridorId: reverseEdge.corridorId,
      originNodeId,
      destinationNodeId,
      distance: traveledDistance,
      staticRisk: reverseEdge.staticRisk * (traveledDistance / rawEdge.distance),
      traversalModifier: reverseEdge.traversalModifier,
      spans: splitEdgeSpans(reverseEdge.spans, rawEdge.distance - traveledDistance).remaining,
    };
  }

  const plan = {
    kind: "planned" as const,
    originPortId: originNodeId,
    destinationPortId: destinationNodeId,
    edges: [syntheticEdge],
    totalDistance: syntheticEdge.distance,
    unroundedDurationMilliseconds:
      (syntheticEdge.distance / resolvedState.fleet.speed) *
      syntheticEdge.traversalModifier *
      content.navigationConstants.timePerDistanceUnitMilliseconds,
  };
  const estimate = estimatePassage(plan, content, resolvedState.fleet.speed);
  const passageSnapshot: PlannedPassageSnapshot = {
    kind: "planned",
    originPortId: originNodeId,
    destinationPortId: destinationNodeId,
    edges: resolveEdgeTimeline(estimate.edges, content, resolvedState.fleet.speed, estimate.durationMilliseconds),
    totalDistance: estimate.totalDistance,
    plannedSailingDurationMilliseconds: estimate.durationMilliseconds,
    pacingMultiplier,
    requiredSupplies: { ...estimate.requiredSupplies },
    staticRisk: estimate.staticRisk,
    departedMidEdge: true,
  };
  const scheduledDurationMilliseconds = scheduledDuration(
    passageSnapshot.plannedSailingDurationMilliseconds,
    pacingMultiplier,
  );
  const readiness = supplyReadiness(resolvedState, passageSnapshot.requiredSupplies);
  const error =
    readiness.food.missing > 0 || readiness.water.missing > 0
      ? `Requires Food ${readiness.food.required} and Water ${readiness.water.required} before departure.`
      : null;
  return {
    exit,
    nodeId: destinationNodeId,
    quoteId: breakOffQuoteId(resolvedState, resolvedVoyage, exit, destinationNodeId, pacingMultiplier),
    passage: passageSnapshot,
    scheduledDurationMilliseconds,
    supplyConsumptionMicroUnitsPerSecond: estimate.supplyConsumptionMicroUnitsPerSecond,
    readiness,
    error,
  };
}

/** Quotes both legal break-off exits, or the immediate hold, from canonical state without mutating it. */
export function previewBreakOff(
  content: WorldContent,
  state: GameState,
  now: number,
  pacingMultiplier = 1,
): BreakOffPreview {
  if (!validPacingMultiplier(pacingMultiplier)) return { kind: "unavailable", error: "Voyage pacing is invalid." };
  const resolved = resolveBreakOffPosition(content, state, now);
  if ("error" in resolved) return { kind: "unavailable", error: resolved.error };
  const { resolvedState, resolvedVoyage } = resolved;
  const position = (resolvedVoyage.progress as Extract<VoyageProgress, { kind: "planned" }>).position;
  if (position.kind === "node")
    return {
      kind: "at-node",
      nodeId: position.nodeId,
      quoteId: JSON.stringify({ voyageId: resolvedVoyage.id, nodeId: position.nodeId, kind: "at-node" }),
    };
  return {
    kind: "mid-edge",
    prior: buildBreakOffOption(content, resolvedState, resolvedVoyage, "prior", pacingMultiplier),
    next: buildBreakOffOption(content, resolvedState, resolvedVoyage, "next", pacingMultiplier),
  };
}

/** Commits the immutable original Passage's remaining traversal as a fresh connector Passage to the chosen exit node. */
export function breakOffVoyage(
  content: WorldContent,
  state: GameState,
  now: number,
  exit: BreakOffExitId,
  expectedQuoteId: string,
  seed: number,
  pacingMultiplier = 1,
): RuleResult {
  const preview = previewBreakOff(content, state, now, pacingMultiplier);
  if (preview.kind === "unavailable") return { state, events: [], error: preview.error };
  if (preview.kind === "at-node")
    return { state, events: [], error: "The Fleet has already reached a node; hold there instead." };
  const option = exit === "prior" ? preview.prior : preview.next;
  if (option.error) return { state, events: [], error: option.error };
  if (
    !option.passage ||
    !option.quoteId ||
    option.quoteId !== expectedQuoteId ||
    !option.scheduledDurationMilliseconds ||
    !option.supplyConsumptionMicroUnitsPerSecond
  )
    return { state, events: [], error: "This break-off quote is stale. Review the latest exit details." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, events: [], error: "Break-off time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, events: [], error: "A secure non-zero Voyage seed is required." };

  const resolved = resolveBreakOffPosition(content, state, now);
  if ("error" in resolved) return { state, events: [], error: resolved.error };
  const { resolvedState, resolvedVoyage } = resolved;

  const plannedArrivesAt = now + option.scheduledDurationMilliseconds;
  const voyageBase = {
    id: `voyage-break-off-${exit}-${resolvedVoyage.id}-${now}`,
    departedAt: now,
    plannedArrivesAt,
    passage: { ...option.passage, edges: cloneSnapshotEdges(option.passage.edges) },
    supplyCost: 0,
    seed,
  };
  const voyage: Voyage = {
    ...voyageBase,
    progress: initialProgress(
      voyageBase.passage,
      now,
      plannedArrivesAt,
      option.supplyConsumptionMicroUnitsPerSecond,
      resolvedVoyage.progress.supplyLedger.remainderMicroUnitMilliseconds,
    ),
  };
  return {
    state: { ...resolvedState, voyage },
    events: [
      { kind: "voyage-broke-off", at: now, voyageId: voyage.id, destinationPortId: voyage.passage.destinationPortId },
    ],
  };
}

/** Commits an immediate break-off when the resolved position already lands exactly on a node. */
export function breakOffAtNode(
  content: WorldContent,
  state: GameState,
  now: number,
  expectedQuoteId: string,
  seed: number,
): RuleResult {
  const preview = previewBreakOff(content, state, now);
  if (preview.kind === "unavailable") return { state, events: [], error: preview.error };
  if (preview.kind === "mid-edge") return { state, events: [], error: "The Fleet is still mid-edge; choose an exit." };
  if (preview.quoteId !== expectedQuoteId)
    return { state, events: [], error: "This break-off quote is stale. Review the latest exit details." };
  if (!Number.isSafeInteger(now) || now < 0) return { state, events: [], error: "Break-off time is invalid." };
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff)
    return { state, events: [], error: "A secure non-zero Voyage seed is required." };

  const resolved = resolveBreakOffPosition(content, state, now);
  if ("error" in resolved) return { state, events: [], error: resolved.error };
  const { resolvedState, resolvedVoyage } = resolved;
  const arrival = arriveAtNode(
    content,
    resolvedState,
    preview.nodeId,
    resolvedVoyage.passage.originPortId,
    now,
    resolvedVoyage.id,
    seed,
    resolvedVoyage.supplyCost,
  );
  if (arrival.error) return arrival;
  return {
    state: arrival.state,
    events: [
      { kind: "voyage-broke-off", at: now, voyageId: resolvedVoyage.id, destinationPortId: preview.nodeId },
      ...arrival.events,
    ],
  };
}
