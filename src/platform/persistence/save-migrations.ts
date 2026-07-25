import {
  SUPPLY_IDS,
  type CargoStack,
  type PassageEdgeSnapshot,
  type PassageSnapshot,
  type GameState,
  type Voyage,
  type VoyageProgress,
  type VoyageSupplies,
} from "@/core/model/game";
import { createInitialGameState } from "@/core/state/initial-game-state";

export const CURRENT_SAVE_VERSION = 9;
const SUPPLY_REMAINDER_THRESHOLD = 1_000_000_000;

export type SaveEnvelope = { version: 9; savedAt: number; state: GameState };
export type SaveLoadResult =
  { kind: "current"; envelope: SaveEnvelope } | { kind: "migrated"; envelope: SaveEnvelope } | { kind: "corrupt" };

type PersistedV6PassageSnapshot =
  | {
      kind: "planned";
      originPortId: string;
      destinationPortId: string;
      simulationDurationMilliseconds: number;
      scheduledDurationMilliseconds: number;
      pacingMultiplier: number;
      requiredSupplies: VoyageSupplies;
      staticRisk: number;
      edges: PassageEdgeSnapshot[];
      totalDistance: number;
    }
  | {
      kind: "legacy-route";
      legacyRouteId: string;
      originPortId: string;
      destinationPortId: string;
      simulationDurationMilliseconds: number;
      scheduledDurationMilliseconds: number;
      pacingMultiplier: number;
      requiredSupplies: VoyageSupplies;
      staticRisk: number;
    };
type PersistedV6Voyage = {
  id: string;
  departedAt: number;
  plannedArrivesAt: number;
  passage: PersistedV6PassageSnapshot;
  supplyCost: number;
  seed: number;
};
type PersistedV6GameState = Omit<GameState, "schemaVersion" | "voyage"> & {
  schemaVersion: 6;
  voyage: PersistedV6Voyage | null;
};

type PersistedV7Voyage = Omit<Voyage, "progress">;
type PersistedV7GameState = Omit<GameState, "schemaVersion" | "voyage"> & {
  schemaVersion: 7;
  voyage: PersistedV7Voyage | null;
};
type PersistedV8GameState = Omit<GameState, "schemaVersion" | "fleet"> & {
  schemaVersion: 8;
  fleet: Omit<GameState["fleet"], "holdingNavPointId" | "holdingOriginNodeId">;
};

type LegacyRouteVoyage = {
  id: string;
  routeId: string;
  originPortId: string;
  destinationPortId: string;
  departedAt: number;
  plannedArrivesAt: number;
  staticRisk: number;
  requiredSupplies: VoyageSupplies;
  supplyCost: number;
  seed: number;
};
type PersistedV5GameState = Omit<PersistedV6GameState, "schemaVersion" | "voyage"> & {
  schemaVersion: 5;
  voyage: LegacyRouteVoyage | null;
};
type V4GameState = Omit<PersistedV5GameState, "schemaVersion" | "fleet"> & {
  schemaVersion: 4;
  fleet: Omit<PersistedV5GameState["fleet"], "speed">;
};
type V3GameState = Omit<V4GameState, "schemaVersion" | "fleet"> & {
  schemaVersion: 3;
  fleet: Omit<V4GameState["fleet"], "supplyTargets" | "autoRestockOnArrival">;
};
type V2GameState = Omit<V3GameState, "schemaVersion" | "fleet"> & {
  schemaVersion: 2;
  fleet: Omit<V3GameState["fleet"], "supplies"> & {
    supplies: Record<"food" | "water" | "medicine" | "rope" | "sails", CargoStack>;
  };
};

const LEGACY_ROUTE_COMPATIBILITY: Record<
  string,
  Omit<LegacyRouteVoyage, "id" | "departedAt" | "plannedArrivesAt" | "supplyCost" | "seed"> & {
    durationMilliseconds: number;
  }
> = {
  "lisbon-faro": {
    routeId: "lisbon-faro",
    durationMilliseconds: 2_000,
    originPortId: "lisbon",
    destinationPortId: "faro",
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  "faro-lisbon": {
    routeId: "faro-lisbon",
    durationMilliseconds: 2_000,
    originPortId: "faro",
    destinationPortId: "lisbon",
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  "lisbon-tangier": {
    routeId: "lisbon-tangier",
    durationMilliseconds: 5_000,
    originPortId: "lisbon",
    destinationPortId: "tangier",
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  "tangier-lisbon": {
    routeId: "tangier-lisbon",
    durationMilliseconds: 5_000,
    originPortId: "tangier",
    destinationPortId: "lisbon",
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  "faro-tangier": {
    routeId: "faro-tangier",
    durationMilliseconds: 4_000,
    originPortId: "faro",
    destinationPortId: "tangier",
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
  "tangier-faro": {
    routeId: "tangier-faro",
    durationMilliseconds: 4_000,
    originPortId: "tangier",
    destinationPortId: "faro",
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
};

const DROPPED_V1_FIELDS = [
  "Captain",
  "Fame",
  "Knowledge",
  "Skills",
  "Action Mastery",
  "selected Action presentation",
  "V3 logs",
  "running Action",
];

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function isNonNegativeWhole(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function isRisk(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
function isValidSeed(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 0xffff_ffff;
}
function isVoyageSupplies(value: unknown): value is VoyageSupplies {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VoyageSupplies>;
  return isNonNegativeWhole(candidate.food) && isNonNegativeWhole(candidate.water);
}
function isCargoStack(value: unknown): value is CargoStack {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CargoStack>;
  return isFiniteNonNegative(candidate.quantity) && isFiniteNonNegative(candidate.totalCostBasis);
}

function hasV8FleetShape(value: unknown): value is PersistedV8GameState["fleet"] {
  if (!value || typeof value !== "object") return false;
  const fleet = value as Partial<GameState["fleet"]>;
  return (
    isNonEmptyString(fleet.locationPortId) &&
    isFiniteNonNegative(fleet.gold) &&
    typeof fleet.speed === "number" &&
    Number.isFinite(fleet.speed) &&
    fleet.speed > 0 &&
    typeof fleet.autoRestockOnArrival === "boolean" &&
    !!fleet.supplyTargets &&
    SUPPLY_IDS.every((id) => isNonNegativeWhole(fleet.supplyTargets?.[id]) && isCargoStack(fleet.supplies?.[id]))
  );
}

function hasCurrentFleetShape(value: unknown): value is GameState["fleet"] {
  if (!hasV8FleetShape(value)) return false;
  const fleet = value as Partial<GameState["fleet"]>;
  return (
    (fleet.holdingNavPointId === null || isNonEmptyString(fleet.holdingNavPointId)) &&
    (fleet.holdingOriginNodeId === null || isNonEmptyString(fleet.holdingOriginNodeId))
  );
}

function hasV4FleetShape(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const fleet = value as Partial<V4GameState["fleet"]>;
  return (
    isNonEmptyString(fleet.locationPortId) &&
    isFiniteNonNegative(fleet.gold) &&
    typeof fleet.autoRestockOnArrival === "boolean" &&
    !!fleet.supplyTargets &&
    SUPPLY_IDS.every((id) => isNonNegativeWhole(fleet.supplyTargets?.[id]) && isCargoStack(fleet.supplies?.[id]))
  );
}

function isLegacyRouteVoyage(value: unknown): value is LegacyRouteVoyage {
  if (!value || typeof value !== "object") return false;
  const voyage = value as Partial<LegacyRouteVoyage>;
  return (
    isNonEmptyString(voyage.id) &&
    isNonEmptyString(voyage.routeId) &&
    isNonEmptyString(voyage.originPortId) &&
    isNonEmptyString(voyage.destinationPortId) &&
    isNonNegativeWhole(voyage.departedAt) &&
    isNonNegativeWhole(voyage.plannedArrivesAt) &&
    voyage.plannedArrivesAt >= voyage.departedAt &&
    isRisk(voyage.staticRisk) &&
    isVoyageSupplies(voyage.requiredSupplies) &&
    isFiniteNonNegative(voyage.supplyCost) &&
    isValidSeed(voyage.seed)
  );
}

function isV6PassageSnapshot(value: unknown): value is PersistedV6PassageSnapshot {
  if (!value || typeof value !== "object") return false;
  const passage = value as Partial<PersistedV6PassageSnapshot>;
  if (
    !isNonEmptyString(passage.originPortId) ||
    !isNonEmptyString(passage.destinationPortId) ||
    !isNonNegativeWhole(passage.simulationDurationMilliseconds) ||
    passage.simulationDurationMilliseconds < 1 ||
    !isNonNegativeWhole(passage.scheduledDurationMilliseconds) ||
    passage.scheduledDurationMilliseconds < 1 ||
    typeof passage.pacingMultiplier !== "number" ||
    !Number.isFinite(passage.pacingMultiplier) ||
    passage.pacingMultiplier <= 0 ||
    !isVoyageSupplies(passage.requiredSupplies) ||
    !isRisk(passage.staticRisk)
  )
    return false;
  if (passage.kind === "legacy-route") return isNonEmptyString(passage.legacyRouteId);
  const planned = passage as Partial<Extract<PersistedV6PassageSnapshot, { kind: "planned" }>>;
  if (
    planned.kind !== "planned" ||
    !Array.isArray(planned.edges) ||
    typeof planned.totalDistance !== "number" ||
    !(planned.totalDistance > 0)
  )
    return false;
  if (planned.edges.length === 0 || !planned.edges.every(isPassageEdgeSnapshot)) return false;
  let previousOffset = 0;
  for (const edge of planned.edges) {
    if (edge.simulationEndOffsetMilliseconds < previousOffset) return false;
    for (const span of edge.spans) {
      if (
        span.simulationEndOffsetMilliseconds < previousOffset ||
        span.simulationEndOffsetMilliseconds > edge.simulationEndOffsetMilliseconds
      )
        return false;
      previousOffset = span.simulationEndOffsetMilliseconds;
    }
    if (edge.spans.at(-1)?.simulationEndOffsetMilliseconds !== edge.simulationEndOffsetMilliseconds) return false;
    previousOffset = edge.simulationEndOffsetMilliseconds;
  }
  return previousOffset === planned.simulationDurationMilliseconds;
}

function isPassageSnapshot(value: unknown): value is PassageSnapshot {
  if (!value || typeof value !== "object") return false;
  const passage = value as Partial<PassageSnapshot>;
  if (
    !isNonEmptyString(passage.originPortId) ||
    !isNonEmptyString(passage.destinationPortId) ||
    !isNonNegativeWhole(passage.plannedSailingDurationMilliseconds) ||
    passage.plannedSailingDurationMilliseconds < 1 ||
    typeof passage.pacingMultiplier !== "number" ||
    !Number.isFinite(passage.pacingMultiplier) ||
    passage.pacingMultiplier <= 0 ||
    !isVoyageSupplies(passage.requiredSupplies) ||
    !isRisk(passage.staticRisk)
  )
    return false;
  if (passage.kind === "legacy-route") return isNonEmptyString(passage.legacyRouteId);
  const planned = passage as Partial<Extract<PassageSnapshot, { kind: "planned" }>>;
  if (
    planned.kind !== "planned" ||
    !Array.isArray(planned.edges) ||
    typeof planned.totalDistance !== "number" ||
    !(planned.totalDistance > 0)
  )
    return false;
  if (planned.edges.length === 0 || !planned.edges.every(isPassageEdgeSnapshot)) return false;
  let previousOffset = 0;
  for (const edge of planned.edges) {
    if (edge.simulationEndOffsetMilliseconds < previousOffset) return false;
    for (const span of edge.spans) {
      if (
        span.simulationEndOffsetMilliseconds < previousOffset ||
        span.simulationEndOffsetMilliseconds > edge.simulationEndOffsetMilliseconds
      )
        return false;
      previousOffset = span.simulationEndOffsetMilliseconds;
    }
    if (edge.spans.at(-1)?.simulationEndOffsetMilliseconds !== edge.simulationEndOffsetMilliseconds) return false;
    previousOffset = edge.simulationEndOffsetMilliseconds;
  }
  return previousOffset === planned.plannedSailingDurationMilliseconds;
}

function isPassageEdgeSnapshot(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const edge = value as { [key: string]: unknown };
  const spans = edge.spans as Array<{ subRegionId: unknown; simulationEndOffsetMilliseconds: unknown }>;
  return (
    isNonEmptyString(edge.id) &&
    isNonEmptyString(edge.originNodeId) &&
    isNonEmptyString(edge.destinationNodeId) &&
    isNonNegativeWhole(edge.simulationEndOffsetMilliseconds) &&
    isRisk(edge.staticRisk) &&
    Array.isArray(edge.spans) &&
    edge.spans.length > 0 &&
    spans.every(
      (span) =>
        !!span &&
        typeof span === "object" &&
        isNonEmptyString((span as { subRegionId?: unknown }).subRegionId) &&
        isNonNegativeWhole((span as { simulationEndOffsetMilliseconds?: unknown }).simulationEndOffsetMilliseconds),
    )
  );
}

function isV6State(value: unknown): value is PersistedV6GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PersistedV6GameState>;
  if (state.schemaVersion !== 6 || !hasCurrentFleetShape(state.fleet) || !state.marketSession) return false;
  if (state.voyage === null) return true;
  if (!state.voyage || typeof state.voyage !== "object") return false;
  const voyage = state.voyage;
  return (
    isNonEmptyString(voyage.id) &&
    isNonNegativeWhole(voyage.departedAt) &&
    isNonNegativeWhole(voyage.plannedArrivesAt) &&
    voyage.plannedArrivesAt >= voyage.departedAt &&
    isFiniteNonNegative(voyage.supplyCost) &&
    isValidSeed(voyage.seed) &&
    isV6PassageSnapshot(voyage.passage) &&
    voyage.plannedArrivesAt - voyage.departedAt === voyage.passage.scheduledDurationMilliseconds
  );
}

function isPersistedVoyage(value: unknown): value is PersistedV7Voyage {
  if (!value || typeof value !== "object") return false;
  return (
    isNonEmptyString((value as Partial<PersistedV7Voyage>).id) &&
    isNonNegativeWhole((value as Partial<PersistedV7Voyage>).departedAt) &&
    isNonNegativeWhole((value as Partial<PersistedV7Voyage>).plannedArrivesAt) &&
    (value as Partial<PersistedV7Voyage>).plannedArrivesAt! >= (value as Partial<PersistedV7Voyage>).departedAt! &&
    isFiniteNonNegative((value as Partial<PersistedV7Voyage>).supplyCost) &&
    isValidSeed((value as Partial<PersistedV7Voyage>).seed) &&
    isPassageSnapshot((value as Partial<PersistedV7Voyage>).passage)
  );
}

function isV7State(value: unknown): value is PersistedV7GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PersistedV7GameState>;
  return (
    state.schemaVersion === 7 &&
    hasCurrentFleetShape(state.fleet) &&
    !!state.marketSession &&
    (state.voyage === null || isPersistedVoyage(state.voyage))
  );
}

function isSupplyLedger(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const ledger = value as Partial<VoyageProgress["supplyLedger"]>;
  if (!isVoyageSupplies(ledger.consumedSupplies) || !isVoyageSupplies(ledger.remainderMicroUnitMilliseconds))
    return false;
  if (
    ledger.remainderMicroUnitMilliseconds.food >= SUPPLY_REMAINDER_THRESHOLD ||
    ledger.remainderMicroUnitMilliseconds.water >= SUPPLY_REMAINDER_THRESHOLD
  )
    return false;
  if (ledger.accountingMode === "prepaid") return true;
  return (
    ledger.accountingMode === "accruing" &&
    isVoyageSupplies(ledger.supplyConsumptionMicroUnitsPerSecond) &&
    isNonNegativeWhole(ledger.supplyConsumptionMicroUnitsPerSecond.food) &&
    isNonNegativeWhole(ledger.supplyConsumptionMicroUnitsPerSecond.water)
  );
}

function isVoyageProgress(value: unknown, passage: PassageSnapshot, voyage: PersistedV7Voyage): boolean {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<VoyageProgress>;
  const ledger = progress.supplyLedger;
  if (
    !isNonNegativeWhole(progress.resolvedAt) ||
    !isNonNegativeWhole(progress.resolvedSimulationOffsetMilliseconds) ||
    !isNonNegativeWhole(progress.nextBoundaryAt) ||
    progress.resolvedAt > voyage.plannedArrivesAt ||
    progress.nextBoundaryAt < progress.resolvedAt ||
    progress.nextBoundaryAt > voyage.plannedArrivesAt ||
    progress.resolvedSimulationOffsetMilliseconds > passage.plannedSailingDurationMilliseconds ||
    !isSupplyLedger(ledger)
  )
    return false;
  const validatedLedger = ledger as VoyageProgress["supplyLedger"];
  if (
    validatedLedger.consumedSupplies.food > passage.requiredSupplies.food ||
    validatedLedger.consumedSupplies.water > passage.requiredSupplies.water
  )
    return false;
  if (passage.kind === "legacy-route")
    return progress.kind === "legacy-route" && validatedLedger.accountingMode === "prepaid";
  if (
    progress.kind !== "planned" ||
    !isNonNegativeWhole(progress.completedSpanCount) ||
    !isNonNegativeWhole(progress.completedEdgeCount)
  )
    return false;
  if (progress.completedSpanCount > passage.edges.reduce((count, edge) => count + edge.spans.length, 0)) return false;
  if (progress.completedEdgeCount > passage.edges.length || !progress.position || typeof progress.position !== "object")
    return false;
  const position = progress.position as {
    kind?: unknown;
    nodeId?: unknown;
    edgeId?: unknown;
    originNodeId?: unknown;
    destinationNodeId?: unknown;
    simulationOffsetMilliseconds?: unknown;
  };
  return (
    (position.kind === "node" && isNonEmptyString(position.nodeId)) ||
    (position.kind === "edge" &&
      isNonEmptyString(position.edgeId) &&
      isNonEmptyString(position.originNodeId) &&
      isNonEmptyString(position.destinationNodeId) &&
      isNonNegativeWhole(position.simulationOffsetMilliseconds))
  );
}

function isV8State(value: unknown): value is PersistedV8GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PersistedV8GameState>;
  if (state.schemaVersion !== 8 || !hasV8FleetShape(state.fleet) || !state.marketSession) return false;
  if (state.voyage === null) return true;
  return (
    !!state.voyage &&
    isPersistedVoyage(state.voyage) &&
    isVoyageProgress(state.voyage.progress, state.voyage.passage, state.voyage)
  );
}
function isV9State(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<GameState>;
  if (state.schemaVersion !== 9 || !hasCurrentFleetShape(state.fleet) || !state.marketSession) return false;
  return (
    state.voyage === null ||
    (!!state.voyage &&
      isPersistedVoyage(state.voyage) &&
      isVoyageProgress(state.voyage.progress, state.voyage.passage, state.voyage))
  );
}

function isV5State(value: unknown): value is PersistedV5GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PersistedV5GameState>;
  return (
    state.schemaVersion === 5 &&
    hasCurrentFleetShape(state.fleet) &&
    !!state.marketSession &&
    (state.voyage === null || isLegacyRouteVoyage(state.voyage))
  );
}
function isV4State(value: unknown): value is V4GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<V4GameState>;
  return state.schemaVersion === 4 && hasV4FleetShape(state.fleet) && !!state.marketSession;
}
function isV3State(value: unknown): value is V3GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<V3GameState>;
  return (
    state.schemaVersion === 3 &&
    !!state.fleet &&
    isNonEmptyString(state.fleet.locationPortId) &&
    !!state.marketSession &&
    isFiniteNonNegative(state.fleet.gold) &&
    SUPPLY_IDS.every((id) => isCargoStack(state.fleet?.supplies?.[id]))
  );
}
function isV2State(value: unknown): value is V2GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    schemaVersion?: unknown;
    fleet?: { locationPortId?: unknown; gold?: unknown; supplies?: unknown };
    marketSession?: unknown;
  };
  if (
    candidate.schemaVersion !== 2 ||
    !candidate.fleet ||
    !isNonEmptyString(candidate.fleet.locationPortId) ||
    !candidate.marketSession ||
    !isFiniteNonNegative(candidate.fleet.gold) ||
    !candidate.fleet.supplies ||
    typeof candidate.fleet.supplies !== "object"
  )
    return false;
  const supplies = candidate.fleet.supplies as Record<string, unknown>;
  return ["food", "water", "medicine", "rope", "sails"].every((id) => isCargoStack(supplies[id]));
}

function migrateV2State(state: V2GameState, now: number): V3GameState {
  const { rope, sails, ...supplies } = state.fleet.supplies;
  return {
    ...state,
    schemaVersion: 3,
    fleet: { ...state.fleet, supplies: { ...supplies, munitions: rope, spares: sails } },
    activity: [
      {
        id: `v2-supplies-migrated-${now}`,
        at: now,
        message: "Munitions and Spares stores were renamed without changing their quantities or cost basis.",
        tone: "info",
      },
      ...state.activity,
    ],
  };
}
function migrateV3State(state: V3GameState): V4GameState {
  return {
    ...state,
    schemaVersion: 4,
    fleet: {
      ...state.fleet,
      supplyTargets: Object.fromEntries(
        SUPPLY_IDS.map((id) => [id, state.fleet.supplies[id].quantity]),
      ) as V4GameState["fleet"]["supplyTargets"],
      autoRestockOnArrival: false,
    },
  };
}
function migrateV4State(state: V4GameState): PersistedV5GameState {
  return { ...state, schemaVersion: 5, fleet: { ...state.fleet, speed: 100 } };
}
function migrateV5State(state: PersistedV5GameState): PersistedV6GameState | null {
  if (!state.voyage) return { ...state, schemaVersion: 6, voyage: null };
  const voyage = state.voyage;
  const expected = LEGACY_ROUTE_COMPATIBILITY[voyage.routeId];
  if (
    !expected ||
    voyage.originPortId !== expected.originPortId ||
    voyage.destinationPortId !== expected.destinationPortId ||
    voyage.staticRisk !== expected.staticRisk ||
    voyage.requiredSupplies.food !== expected.requiredSupplies.food ||
    voyage.requiredSupplies.water !== expected.requiredSupplies.water ||
    voyage.plannedArrivesAt - voyage.departedAt !== expected.durationMilliseconds
  )
    return null;
  const duration = voyage.plannedArrivesAt - voyage.departedAt;
  if (duration < 1) return null;
  return {
    ...state,
    schemaVersion: 6,
    voyage: {
      id: voyage.id,
      departedAt: voyage.departedAt,
      plannedArrivesAt: voyage.plannedArrivesAt,
      passage: {
        kind: "legacy-route",
        legacyRouteId: voyage.routeId,
        originPortId: voyage.originPortId,
        destinationPortId: voyage.destinationPortId,
        simulationDurationMilliseconds: duration,
        scheduledDurationMilliseconds: duration,
        pacingMultiplier: 1,
        requiredSupplies: { ...voyage.requiredSupplies },
        staticRisk: voyage.staticRisk,
      },
      supplyCost: voyage.supplyCost,
      seed: voyage.seed,
    },
  };
}

function migrateV6Passage(passage: PersistedV6PassageSnapshot): PassageSnapshot {
  if (passage.kind === "legacy-route") {
    return {
      kind: "legacy-route",
      legacyRouteId: passage.legacyRouteId,
      originPortId: passage.originPortId,
      destinationPortId: passage.destinationPortId,
      plannedSailingDurationMilliseconds: passage.simulationDurationMilliseconds,
      pacingMultiplier: passage.pacingMultiplier,
      requiredSupplies: { ...passage.requiredSupplies },
      staticRisk: passage.staticRisk,
    };
  }
  return {
    kind: "planned",
    originPortId: passage.originPortId,
    destinationPortId: passage.destinationPortId,
    plannedSailingDurationMilliseconds: passage.simulationDurationMilliseconds,
    pacingMultiplier: passage.pacingMultiplier,
    requiredSupplies: { ...passage.requiredSupplies },
    staticRisk: passage.staticRisk,
    edges: passage.edges.map((edge) => ({ ...edge, spans: edge.spans.map((span) => ({ ...span })) })),
    totalDistance: passage.totalDistance,
  };
}

function firstPlannedBoundaryAt(voyage: Pick<Voyage, "departedAt" | "plannedArrivesAt" | "passage">): number {
  if (voyage.passage.kind !== "planned") return voyage.plannedArrivesAt;
  const firstOffset = voyage.passage.edges[0]?.spans[0]?.simulationEndOffsetMilliseconds;
  if (!firstOffset) return voyage.plannedArrivesAt;
  const scheduledDuration = voyage.plannedArrivesAt - voyage.departedAt;
  return Math.min(
    voyage.plannedArrivesAt,
    voyage.departedAt +
      Math.ceil((firstOffset * scheduledDuration) / voyage.passage.plannedSailingDurationMilliseconds),
  );
}

function prepaidProgress(voyage: PersistedV7Voyage): VoyageProgress {
  const supplyLedger = {
    accountingMode: "prepaid" as const,
    consumedSupplies: { ...voyage.passage.requiredSupplies },
    remainderMicroUnitMilliseconds: { food: 0, water: 0 },
  };
  if (voyage.passage.kind === "legacy-route") {
    return {
      kind: "legacy-route",
      resolvedAt: voyage.departedAt,
      resolvedSimulationOffsetMilliseconds: 0,
      nextBoundaryAt: voyage.plannedArrivesAt,
      supplyLedger,
    };
  }
  return {
    kind: "planned",
    resolvedAt: voyage.departedAt,
    resolvedSimulationOffsetMilliseconds: 0,
    completedSpanCount: 0,
    completedEdgeCount: 0,
    position: { kind: "node", nodeId: voyage.passage.originPortId },
    nextBoundaryAt: firstPlannedBoundaryAt(voyage),
    supplyLedger,
  };
}

function migrateV7State(state: PersistedV7GameState): PersistedV8GameState {
  if (!state.voyage) return { ...state, schemaVersion: 8, voyage: null };
  return { ...state, schemaVersion: 8, voyage: { ...state.voyage, progress: prepaidProgress(state.voyage) } };
}

function migrateV8State(state: PersistedV8GameState): GameState {
  return {
    ...state,
    schemaVersion: 9,
    fleet: { ...state.fleet, holdingNavPointId: null, holdingOriginNodeId: null },
  };
}

function migrateV6State(state: PersistedV6GameState): PersistedV8GameState {
  const v7: PersistedV7GameState = !state.voyage
    ? { ...state, schemaVersion: 7, voyage: null }
    : {
        ...state,
        schemaVersion: 7,
        voyage: {
          ...state.voyage,
          passage: migrateV6Passage(state.voyage.passage),
        },
      };
  return migrateV7State(v7);
}

export function createSaveEnvelope(state: GameState, now: number): SaveEnvelope {
  return { version: CURRENT_SAVE_VERSION, savedAt: now, state };
}

export function loadSave(value: unknown, now: number): SaveLoadResult {
  if (!value || typeof value !== "object") return { kind: "corrupt" };
  const candidate = value as { version?: unknown; savedAt?: unknown; state?: unknown };
  if (candidate.version === 9 && isFiniteNonNegative(candidate.savedAt) && isV9State(candidate.state))
    return { kind: "current", envelope: { version: 9, savedAt: candidate.savedAt, state: candidate.state } };
  if (candidate.version === 8 && isFiniteNonNegative(candidate.savedAt) && isV8State(candidate.state))
    return { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(candidate.state), now) };
  if (candidate.version === 7 && isFiniteNonNegative(candidate.savedAt) && isV7State(candidate.state))
    return { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV7State(candidate.state)), now) };
  if (candidate.version === 6 && isFiniteNonNegative(candidate.savedAt) && isV6State(candidate.state))
    return { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV6State(candidate.state)), now) };
  if (candidate.version === 5 && isFiniteNonNegative(candidate.savedAt) && isV5State(candidate.state)) {
    const state = migrateV5State(candidate.state);
    return state
      ? { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV6State(state)), now) }
      : { kind: "corrupt" };
  }
  if (candidate.version === 4 && isFiniteNonNegative(candidate.savedAt) && isV4State(candidate.state)) {
    const state = migrateV5State(migrateV4State(candidate.state));
    return state
      ? { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV6State(state)), now) }
      : { kind: "corrupt" };
  }
  if (candidate.version === 3 && isFiniteNonNegative(candidate.savedAt) && isV3State(candidate.state)) {
    const state = migrateV5State(migrateV4State(migrateV3State(candidate.state)));
    return state
      ? { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV6State(state)), now) }
      : { kind: "corrupt" };
  }
  if (candidate.version === 2 && isFiniteNonNegative(candidate.savedAt) && isV2State(candidate.state)) {
    const state = migrateV5State(migrateV4State(migrateV3State(migrateV2State(candidate.state, now))));
    return state
      ? { kind: "migrated", envelope: createSaveEnvelope(migrateV8State(migrateV6State(state)), now) }
      : { kind: "corrupt" };
  }
  if (candidate.version !== 1 || !candidate.state || typeof candidate.state !== "object") return { kind: "corrupt" };
  const legacyGold = (candidate.state as { resources?: { gold?: unknown } }).resources?.gold;
  if (!isFiniteNonNegative(legacyGold)) return { kind: "corrupt" };
  const state = createInitialGameState(now);
  state.fleet.gold = legacyGold;
  state.migrationReport = { fromVersion: 1, migratedAt: now, droppedFields: DROPPED_V1_FIELDS, acknowledged: false };
  state.activity = [
    { id: `v1-migrated-${now}`, at: now, message: "V7 save migrated. Review the migration report.", tone: "warning" },
  ];
  return { kind: "migrated", envelope: createSaveEnvelope(state, now) };
}
