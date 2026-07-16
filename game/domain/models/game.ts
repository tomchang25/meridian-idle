export const SUPPLY_IDS = ["food", "water", "medicine", "rope", "sails"] as const;

export type SupplyId = (typeof SUPPLY_IDS)[number];
export type ActivityTone = "info" | "success" | "warning";

export type CargoStack = {
  quantity: number;
  totalCostBasis: number;
};

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

export type PortProgress = {
  xp: number;
};

export type MigrationReport = {
  fromVersion: 1;
  migratedAt: number;
  droppedFields: string[];
  acknowledged: boolean;
};

export type ActivityEntry = {
  id: string;
  at: number;
  message: string;
  tone: ActivityTone;
};

export type V5GameState = {
  schemaVersion: 2;
  createdAt: number;
  world: { knownPortIds: string[] };
  fleet: Fleet;
  portProgress: Record<string, PortProgress>;
  migrationReport: MigrationReport | null;
  activity: ActivityEntry[];
};
