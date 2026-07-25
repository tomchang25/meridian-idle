export const SUPPLY_IDS = ["food", "water", "medicine", "munitions", "spares"] as const;
export const CATEGORY_IDS = ["food", "textile", "metal", "luxury", "livestock"] as const;

export type SupplyId = (typeof SUPPLY_IDS)[number];
export type CategoryId = (typeof CATEGORY_IDS)[number];
export type ActivityTone = "info" | "success" | "warning";

export type CargoStack = { quantity: number; totalCostBasis: number };
export type Fleet = {
  locationPortId: string;
  /** Exact sea location while the Fleet is safely holding at a NavPoint. */
  holdingNavPointId: string | null;
  /** The completed Passage origin shown by the holding itinerary. */
  holdingOriginNodeId: string | null;
  speed: number;
  gold: number;
  cargoCapacity: number;
  hp: number;
  maxHp: number;
  attack: number;
  products: Record<string, CargoStack>;
  supplies: Record<SupplyId, CargoStack>;
  supplyTargets: Record<SupplyId, number>;
  autoRestockOnArrival: boolean;
};
export type PortProgress = { xp: number };
export type MarketSession = {
  id: string;
  portId: string;
  categoryFactors: Record<CategoryId, number>;
  specialtySupply: number;
  netTrade: Record<string, number>;
};

export type VoyageSupplies = {
  food: number;
  water: number;
};

export type VoyagePosition =
  | { kind: "node"; nodeId: string }
  | {
      kind: "edge";
      edgeId: string;
      originNodeId: string;
      destinationNodeId: string;
      simulationOffsetMilliseconds: number;
    };

export type AccruingSailingSupplyLedger = {
  accountingMode: "accruing";
  consumedSupplies: VoyageSupplies;
  /** Fixed-point numerator left after whole Supply units have been removed. */
  remainderMicroUnitMilliseconds: VoyageSupplies;
  supplyConsumptionMicroUnitsPerSecond: VoyageSupplies;
};

export type PrepaidSailingSupplyLedger = {
  /** Compatibility mode for Voyages that deducted their full requirement before schema v8. */
  accountingMode: "prepaid";
  consumedSupplies: VoyageSupplies;
  remainderMicroUnitMilliseconds: VoyageSupplies;
};

export type SailingSupplyLedger = AccruingSailingSupplyLedger | PrepaidSailingSupplyLedger;

export type PlannedVoyageProgress = {
  kind: "planned";
  resolvedAt: number;
  resolvedSimulationOffsetMilliseconds: number;
  completedSpanCount: number;
  completedEdgeCount: number;
  position: VoyagePosition;
  nextBoundaryAt: number;
  supplyLedger: SailingSupplyLedger;
};

export type LegacyRouteVoyageProgress = {
  kind: "legacy-route";
  resolvedAt: number;
  resolvedSimulationOffsetMilliseconds: number;
  nextBoundaryAt: number;
  supplyLedger: PrepaidSailingSupplyLedger;
};

export type VoyageProgress = PlannedVoyageProgress | LegacyRouteVoyageProgress;

export type PassageEdgeSnapshot = {
  id: string;
  originNodeId: string;
  destinationNodeId: string;
  simulationEndOffsetMilliseconds: number;
  staticRisk: number;
  spans: { subRegionId: string; simulationEndOffsetMilliseconds: number }[];
};

type PassageSnapshotBase = {
  originPortId: string;
  destinationPortId: string;
  plannedSailingDurationMilliseconds: number;
  pacingMultiplier: number;
  requiredSupplies: VoyageSupplies;
  staticRisk: number;
};

export type PlannedPassageSnapshot = PassageSnapshotBase & {
  kind: "planned";
  edges: PassageEdgeSnapshot[];
  totalDistance: number;
};

export type LegacyRoutePassageSnapshot = PassageSnapshotBase & {
  kind: "legacy-route";
  legacyRouteId: string;
};

export type PassageSnapshot = PlannedPassageSnapshot | LegacyRoutePassageSnapshot;

export type Voyage = {
  id: string;
  departedAt: number;
  plannedArrivesAt: number;
  passage: PassageSnapshot;
  progress: VoyageProgress;
  supplyCost: number;
  seed: number;
};
export type VoyageResult = {
  voyageId: string;
  arrivedAt: number;
  destinationPortId: string;
  sourceXpGained: number;
  supplyCost: number;
};
export type MigrationReport = { fromVersion: 1; migratedAt: number; droppedFields: string[]; acknowledged: boolean };
export type ActivityEntry = { id: string; at: number; message: string; tone: ActivityTone };

export type GameState = {
  schemaVersion: 9;
  createdAt: number;
  world: { knownPortIds: string[] };
  fleet: Fleet;
  portProgress: Record<string, PortProgress>;
  marketSession: MarketSession;
  voyage: Voyage | null;
  latestVoyageResult: VoyageResult | null;
  migrationReport: MigrationReport | null;
  activity: ActivityEntry[];
};
