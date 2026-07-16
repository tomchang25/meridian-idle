import { SUPPLY_IDS, type CargoStack, type V5GameState } from "@/game/domain/models/game";

function emptyStack(): CargoStack {
  return { quantity: 0, totalCostBasis: 0 };
}

export function createInitialGameState(now: number): V5GameState {
  return {
    schemaVersion: 2,
    createdAt: now,
    world: { knownPortIds: ["lisbon"] },
    fleet: {
      locationPortId: "lisbon",
      gold: 2_000,
      cargoCapacity: 60,
      hp: 100,
      maxHp: 100,
      attack: 10,
      products: {},
      supplies: Object.fromEntries(SUPPLY_IDS.map((id) => [id, emptyStack()])) as V5GameState["fleet"]["supplies"],
    },
    portProgress: { lisbon: { xp: 0 } },
    migrationReport: null,
    activity: [{ id: `world-created-${now}`, at: now, message: "Fleet is docked at Lisbon.", tone: "info" }],
  };
}
