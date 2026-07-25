export const SUPPLY_IDS = ["food", "water", "medicine", "munitions", "spares"] as const;
export const CATEGORY_IDS = ["food", "textile", "metal", "luxury", "livestock"] as const;

export type SupplyId = (typeof SUPPLY_IDS)[number];
export type CategoryId = (typeof CATEGORY_IDS)[number];
export type ActivityTone = "info" | "success" | "warning";

export type CargoStack = { quantity: number; totalCostBasis: number };
export type Fleet = {
  locationPortId: string;
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
  schemaVersion: 7;
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
