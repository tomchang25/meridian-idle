import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameState } from "@/core/model/game";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { GameRuntime, type SaveRepository } from "@/runtime/game-runtime";
import { createSaveEnvelope } from "@/platform/persistence/save-migrations";
import type { SeedSource } from "@/runtime/seed-source";

const seedSource: SeedSource = { isAvailable: () => true, nextSeed: () => 3 };

function departForFaro(runtime: GameRuntime) {
  const preview = runtime.previewVoyage("faro");
  if (!preview.quoteId) throw new Error("Expected Lisbon-to-Faro quote.");
  runtime.departVoyage("faro", preview.quoteId);
}

function repository(saved: unknown = null): SaveRepository & { saves: GameState[] } {
  const saves: GameState[] = [];
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
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock, voyagePacingMultiplier: 20 });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    departForFaro(runtime);

    expect(runtime.getSnapshot().state.voyage).not.toBeNull();

    clock.advance(5_000);
    await vi.advanceTimersByTimeAsync(5_000);

    expect(runtime.getSnapshot().state.voyage).toBeNull();
    expect(runtime.getSnapshot().state.fleet.locationPortId).toBe("faro");
  });

  it("wakes at intermediate Voyage boundaries before arrival", async () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock, voyagePacingMultiplier: 20 });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 1);
    runtime.setSupplyTarget("water", 1);
    runtime.restockAllSupplies();
    departForFaro(runtime);

    clock.advance(200);
    await vi.advanceTimersByTimeAsync(200);

    expect(runtime.getSnapshot().state.voyage?.progress).toMatchObject({
      kind: "planned",
      resolvedSimulationOffsetMilliseconds: 4_000,
    });
    expect(runtime.getSnapshot().state.fleet.locationPortId).toBe("lisbon");
  });

  it("abandons a pending arrival when a new game replaces the world", async () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock, voyagePacingMultiplier: 20 });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    departForFaro(runtime);

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
    const saved = createInitialGameState(0);
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

  it("remains usable across a dispose/activate remount cycle", () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock, voyagePacingMultiplier: 20 });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    departForFaro(runtime);
    expect(runtime.getSnapshot().state.voyage).not.toBeNull();

    // React StrictMode drives the subscribing effect setup/teardown/setup on the
    // same runtime instance; the teardown must not leave it permanently dead.
    runtime.dispose();
    runtime.activate();

    let notifications = 0;
    runtime.subscribe(() => (notifications += 1));

    // The harness settles arrivals by advancing the clock and asking the runtime
    // to resolve, exactly as the debug interface does; this must still work.
    clock.advance(5_000);
    runtime.resolveVoyage();

    expect(runtime.getSnapshot().state.voyage).toBeNull();
    expect(runtime.getSnapshot().state.fleet.locationPortId).toBe("faro");
    expect(notifications).toBeGreaterThan(0);
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

  it("breaks off mid-Voyage, reschedules the boundary to the connector, and holds at the chosen exit", async () => {
    vi.useFakeTimers();
    const clock = controllableClock();
    const runtime = new GameRuntime({ repository: repository(), seedSource, clock, voyagePacingMultiplier: 20 });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    departForFaro(runtime);

    clock.advance(500);
    const preview = runtime.previewBreakOff();
    expect(preview.kind).toBe("mid-edge");
    if (preview.kind !== "mid-edge") throw new Error("Expected a mid-edge break-off preview.");
    expect(preview.next.nodeId).toBe("cape-st-vincent");

    runtime.breakOffVoyage("next", preview.next.quoteId!);
    const connector = runtime.getSnapshot().state.voyage;
    expect(connector?.passage.destinationPortId).toBe("cape-st-vincent");

    // The superseded Passage must never arrive; only the connector's own boundary should fire.
    const delta = connector!.plannedArrivesAt - clock.now();
    clock.advance(delta);
    await vi.advanceTimersByTimeAsync(delta);

    expect(runtime.getSnapshot().state.voyage).toBeNull();
    expect(runtime.getSnapshot().state.fleet.holdingNavPointId).toBe("cape-st-vincent");
    expect(runtime.getSnapshot().state.fleet.locationPortId).toBe("lisbon");
  });

  it("rejects break-off atomically when injected secure randomness becomes unavailable", async () => {
    let available = true;
    const flakySeed: SeedSource = {
      isAvailable: () => available,
      nextSeed: () => {
        if (!available) throw new Error("Secure randomness is unavailable.");
        return 3;
      },
    };
    const clock = controllableClock();
    const runtime = new GameRuntime({
      repository: repository(),
      seedSource: flakySeed,
      clock,
      voyagePacingMultiplier: 20,
    });
    runtime.startNewGame();
    runtime.setSupplyTarget("food", 2);
    runtime.setSupplyTarget("water", 2);
    runtime.restockAllSupplies();
    departForFaro(runtime);

    available = false;
    clock.advance(500);
    const breakOffPreview = runtime.previewBreakOff();
    if (breakOffPreview.kind !== "mid-edge") throw new Error("Expected a mid-edge break-off preview.");
    const voyageBefore = runtime.getSnapshot().state.voyage;
    runtime.breakOffVoyage("next", breakOffPreview.next.quoteId!);

    expect(runtime.getSnapshot().state.voyage).toBe(voyageBefore);
    expect(runtime.getSnapshot().commandError).toBe("Secure randomness is unavailable; break-off was not changed.");
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
