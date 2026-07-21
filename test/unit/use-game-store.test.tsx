import { StrictMode, type ReactNode } from "react";
import { WORLD_CONTENT } from "@/content/catalog";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SeedSource } from "@/runtime/seed-source";
import { useGameStore, type GameStoreDependencies, type SaveRepository } from "@/runtime/use-game-store";
import { buySupply } from "@/core/rules/cargo";
import { departVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope } from "@/platform/persistence/save-migrations";

function repository(raw: unknown | null = null): SaveRepository & {
  loadRaw: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    isAvailable: () => true,
    loadRaw: vi.fn(async () => raw),
    save: vi.fn(async () => undefined),
  };
}

const fixedSeedSource: SeedSource = { isAvailable: () => true, nextSeed: () => 7 };

async function settleHydration() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useGameStore", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retains a failed command error and clears it after a successful transaction", async () => {
    const dependencies: GameStoreDependencies = {
      repository: repository(),
      seedSource: fixedSeedSource,
      clock: { now: () => 10 },
    };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.buyProduct("lisbon-cork", 2));
    expect(result.current.commandError).toBe("Unlocks at Port Level 50.");
    expect(result.current.state.fleet.products).toEqual({});

    act(() => result.current.buyProduct("cod", 2));
    expect(result.current.commandError).toBeNull();
    expect(result.current.state.fleet.products.cod.quantity).toBe(2);
  });

  it("persists Supply targets and applies them against the latest canonical stack", async () => {
    const dependencies: GameStoreDependencies = { repository: repository(), clock: { now: () => 10 } };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.setSupplyTarget("food", 3));
    expect(result.current.state.fleet.supplyTargets.food).toBe(3);
    expect(result.current.state.fleet.supplies.food.quantity).toBe(0);
    act(() => result.current.applySupplyTarget("food"));
    expect(result.current.state.fleet.supplies.food.quantity).toBe(3);
    expect(result.current.state.fleet.gold).toBe(2_000 - 24);

    act(() => result.current.setSupplyTarget("food", 1));
    act(() => result.current.applySupplyTarget("food"));
    expect(result.current.state.fleet.supplies.food.quantity).toBe(1);
    expect(result.current.state.fleet.gold).toBe(2_000 - 24);

    act(() => result.current.applySupplyTarget("food"));
    expect(result.current.commandError).toBe("Supply target already matches the quantity aboard.");
  });

  it("updates arrival automation and restocks all persisted deficits in one command", async () => {
    const dependencies: GameStoreDependencies = { repository: repository(), clock: { now: () => 10 } };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.setSupplyTarget("food", 2));
    act(() => result.current.setSupplyTarget("water", 1));
    act(() => result.current.setAutoRestockOnArrival(true));
    act(() => result.current.restockAllSupplies());

    expect(result.current.state.fleet.autoRestockOnArrival).toBe(true);
    expect(result.current.state.fleet.supplies.food.quantity).toBe(2);
    expect(result.current.state.fleet.supplies.water.quantity).toBe(1);
    expect(result.current.state.fleet.gold).toBe(1_980);
  });

  it("reports loading until repository hydration settles", async () => {
    let resolveLoad: (value: null) => void = () => undefined;
    const pendingRepository = repository();
    pendingRepository.loadRaw = vi.fn(
      () =>
        new Promise<null>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const { result } = renderHook(() => useGameStore({ repository: pendingRepository, clock: { now: () => 10 } }));

    expect(result.current.saveStatus).toBe("loading");

    await act(async () => resolveLoad(null));
    expect(result.current.saveStatus).toBe("saved");
  });

  it("rejects departure atomically when injected secure randomness is unavailable", async () => {
    const unavailableSeed: SeedSource = { isAvailable: () => false, nextSeed: () => null };
    const dependencies: GameStoreDependencies = {
      repository: repository(),
      seedSource: unavailableSeed,
      clock: { now: () => 100 },
    };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.setSupplyTarget("food", 1));
    act(() => result.current.setSupplyTarget("water", 1));
    act(() => result.current.applySupplyTarget("food"));
    act(() => result.current.applySupplyTarget("water"));
    const suppliesBefore = result.current.state.fleet.supplies;
    act(() => result.current.departVoyage("lisbon-faro"));

    expect(result.current.state.voyage).toBeNull();
    expect(result.current.state.fleet.supplies).toBe(suppliesBefore);
    expect(result.current.commandError).toBe("Secure randomness is unavailable; Voyage departure was not changed.");
  });

  it("reschedules after clock rollback and applies one arrival in Strict Mode", async () => {
    vi.useFakeTimers();
    let currentNow = 100;
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(WORLD_CONTENT, state, "water", 1, 2).state;
    state = departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, 3).state;
    const savedRepository = repository(createSaveEnvelope(state, 100));
    const dependencies: GameStoreDependencies = {
      repository: savedRepository,
      seedSource: fixedSeedSource,
      clock: { now: () => currentNow },
    };
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useGameStore(dependencies), { wrapper });
    await settleHydration();
    expect(result.current.state.voyage?.plannedArrivesAt).toBe(2_100);

    currentNow = 50;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.state.voyage?.destinationPortId).toBe("faro");

    currentNow = 2_100;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_050);
    });

    expect(result.current.state.fleet.locationPortId).toBe("faro");
    expect(result.current.state.activity.filter((entry) => entry.id === "voyage-lisbon-faro-100-arrived")).toHaveLength(
      1,
    );
    expect(result.current.state.latestVoyageResult?.arrivedAt).toBe(2_100);
  });
});
