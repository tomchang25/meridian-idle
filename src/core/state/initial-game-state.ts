import { SUPPLY_IDS, type CargoStack, type V6GameState } from "@/core/model/game";
import { createMarketSession } from "@/core/rules/market";

function emptyStack(): CargoStack {
  return { quantity: 0, totalCostBasis: 0 };
}

export function createInitialGameState(now: number): V6GameState {
  return {
    schemaVersion: 6,
    createdAt: now,
    world: { knownPortIds: ["lisbon", "faro", "tangier"] },
    fleet: {
      locationPortId: "lisbon",
      speed: 100,
      gold: 2_000,
      cargoCapacity: 60,
      hp: 100,
      maxHp: 100,
      attack: 10,
      products: {},
      supplies: Object.fromEntries(SUPPLY_IDS.map((id) => [id, emptyStack()])) as V6GameState["fleet"]["supplies"],
      supplyTargets: Object.fromEntries(SUPPLY_IDS.map((id) => [id, 0])) as V6GameState["fleet"]["supplyTargets"],
      autoRestockOnArrival: false,
    },
    portProgress: { lisbon: { xp: 0 }, faro: { xp: 0 }, tangier: { xp: 0 } },
    marketSession: createMarketSession("lisbon", 1, 1),
    voyage: null,
    latestVoyageResult: null,
    migrationReport: null,
    // The world-creation entry is rendered from a runtime event so this layer
    // stays free of player-facing copy.
    activity: [],
  };
}
