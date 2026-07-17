import { SUPPLY_IDS, type CargoStack, type V5GameState } from "@/game/domain/models/game";
import { createMarketSession } from "@/game/domain/rules/market";

function emptyStack(): CargoStack {
  return { quantity: 0, totalCostBasis: 0 };
}

export function createInitialGameState(now: number): V5GameState {
  return {
    schemaVersion: 4,
    createdAt: now,
    world: { knownPortIds: ["lisbon", "faro", "tangier"] },
    fleet: {
      locationPortId: "lisbon",
      gold: 2_000,
      cargoCapacity: 60,
      hp: 100,
      maxHp: 100,
      attack: 10,
      products: {},
      supplies: Object.fromEntries(SUPPLY_IDS.map((id) => [id, emptyStack()])) as V5GameState["fleet"]["supplies"],
      supplyTargets: Object.fromEntries(SUPPLY_IDS.map((id) => [id, 0])) as V5GameState["fleet"]["supplyTargets"],
      autoRestockOnArrival: false,
    },
    portProgress: { lisbon: { xp: 0 }, faro: { xp: 0 }, tangier: { xp: 0 } },
    marketSession: createMarketSession("lisbon", 1, 1),
    voyage: null,
    latestVoyageResult: null,
    migrationReport: null,
    activity: [{ id: `world-created-${now}`, at: now, message: "Fleet is docked at Lisbon.", tone: "info" }],
  };
}
