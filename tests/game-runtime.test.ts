import { beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_CONTENT } from "@/content/catalog";
import type { V5GameState } from "@/core/models/game";
import { departVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { GameRuntime, type SaveRepository } from "@/runtime/game-runtime";
import { createSaveEnvelope } from "@/platform/persistence/save-migrations";
import type { SeedSource } from "@/runtime/seed-source";

const seedSource: SeedSource = { isAvailable: () => true, nextSeed: () => 3 };

function repository(saved: unknown = null): SaveRepository & { saves: V5GameState[] } {
  const saves: V5GameState[] = [];
  return {
    saves,
    isAvailable: () => true,
    loadRaw: () => Promise.resolve(saved),
    save: (state) => {
      saves.push(state);
      return Promise.resolve();
    },
  };
}

/** Simulated time the runtime reads and the test advances. */
function controllableClock(start = 1_000) {
  let current = start;
  return { now: () => current, advance: (ms: number) => (current += ms) };
}

describe("GameRuntime", () => {
  beforeEach(() => vi.useRealTimers());

  it("settles an arrival on its own schedule", async () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    runtime.departVoyage("lisbon-faro");

    expect(runtime.getSnapshot().state.voyage).not.toBeNull();

    clock.advance(5_000);
    await vi.advanceTimersByTimeAsync(5_000);

    expect(runtime.getSnapshot().state.voyage).toBeNull();
    expect(runtime.getSnapshot().state.fleet.locationPortId).toBe("faro");
  });

  it("abandons a pending arrival when a new game replaces the world", async () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    runtime.departVoyage("lisbon-faro");

    // The previous world's arrival is now due, but its world is gone.
    runtime.startNewGame();
    clock.advance(5_000);
    await vi.advanceTimersByTimeAsync(5_000);

    const { state } = runtime.getSnapshot();
    expect(state.voyage).toBeNull();
    expect(state.fleet.locationPortId).toBe("lisbon");
    expect(state.latestVoyageResult).toBeNull();
  });

  it("does not let a late hydration overwrite a world the player already started", async () => {
    let releaseLoad: (value: unknown) => void = () => undefined;
    const slowRepository: SaveRepository = {
      ...repository(),
      loadRaw: () =>
        new Promise((resolve) => {
          releaseLoad = resolve;
        }),
    };
    const saved = departVoyage(WORLD_CONTENT, createInitialGameState(0), "lisbon-faro", 0, 3).state;
    const runtime = new GameRuntime({ repository: slowRepository, seedSource, clock: controllableClock() });
    runtime.hydrate();

    runtime.startNewGame();
    releaseLoad(createSaveEnvelope(saved, 0));
    await Promise.resolve();
    await Promise.resolve();

    expect(runtime.getSnapshot().state.voyage).toBeNull();
    expect(runtime.getSnapshot().saveStatus).toBe("saved");
  });

  it("stops saving and scheduling once disposed", async () => {
    vi.useFakeTimers();
    const store = repository();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: store, seedSource, clock });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 1);

    runtime.dispose();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(store.saves).toHaveLength(0);
  });

  it("persists after the debounce window and reports the save status", async () => {
    vi.useFakeTimers();
    const store = repository();
    const runtime = new GameRuntime({ repository: store, seedSource, clock: controllableClock() });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 1);

    await vi.advanceTimersByTimeAsync(400);

    expect(store.saves).toHaveLength(1);
    expect(store.saves[0].fleet.supplyTargets.food).toBe(1);
    expect(runtime.getSnapshot().saveStatus).toBe("saved");
  });

  it("notifies subscribers on every commit and stops after unsubscribe", () => {
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock: controllableClock() });
    let notifications = 0;
    const unsubscribe = runtime.subscribe(() => (notifications += 1));

    runtime.setSupplyTarget("food", 1);
    expect(notifications).toBe(1);

    unsubscribe();
    runtime.setSupplyTarget("food", 2);
    expect(notifications).toBe(1);
  });
});
