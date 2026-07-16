export const SUPPLY_IDS = ["food", "water", "medicine", "rope", "sails"] as const;
export const CATEGORY_IDS = ["food", "textile", "metal", "luxury", "livestock"] as const;

export type SupplyId = (typeof SUPPLY_IDS)[number];
export type CategoryId = (typeof CATEGORY_IDS)[number];
export type ActivityTone = "info" | "success" | "warning";

export type CargoStack = { quantity: number; totalCostBasis: number };
export type Fleet = {
  locationPortId: string;
  gold: number;
  cargoCapacity: number;
  hp: number;
  maxHp: number;
  attack: number;
  products: Record<string, CargoStack>;
  supplies: Record<SupplyId, CargoStack>;
};
export type PortProgress = { xp: number };
export type MarketSession = {
  id: string;
  portId: string;
  categoryFactors: Record<CategoryId, number>;
  specialtySupply: number;
  netTrade: Record<string, number>;
};
export type Voyage = {
  id: string;
  routeId: string;
  originPortId: string;
  destinationPortId: string;
  departedAt: number;
  plannedArrivesAt: number;
  staticRisk: number;
  requiredSupplies: Pick<Record<SupplyId, number>, "food" | "water">;
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

export type V5GameState = {
  schemaVersion: 2;
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
