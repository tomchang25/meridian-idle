import { StrictMode, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SeedSource } from "@/game/application/seed-source";
import { useGameStore, type GameStoreDependencies, type SaveRepository } from "@/game/application/use-game-store";
import { buySupply } from "@/game/domain/rules/cargo";
import { departVoyage } from "@/game/domain/rules/voyage";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { createSaveEnvelope } from "@/game/infrastructure/persistence/save-migrations";

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
      now: () => 10,
    };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.buyProduct("lisbon-cork"));
    expect(result.current.commandError).toBe("Unlocks at Port Level 50.");
    expect(result.current.state.fleet.products).toEqual({});

    act(() => result.current.buyProduct("cod"));
    expect(result.current.commandError).toBeNull();
    expect(result.current.state.fleet.products.cod.quantity).toBe(1);
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
    const { result } = renderHook(() => useGameStore({ repository: pendingRepository, now: () => 10 }));

    expect(result.current.saveStatus).toBe("loading");

    await act(async () => resolveLoad(null));
    expect(result.current.saveStatus).toBe("saved");
  });

  it("rejects departure atomically when injected secure randomness is unavailable", async () => {
    const unavailableSeed: SeedSource = { isAvailable: () => false, nextSeed: () => null };
    const dependencies: GameStoreDependencies = {
      repository: repository(),
      seedSource: unavailableSeed,
      now: () => 100,
    };
    const { result } = renderHook(() => useGameStore(dependencies));
    await settleHydration();

    act(() => result.current.buySupply("food", 1));
    act(() => result.current.buySupply("water", 1));
    const suppliesBefore = result.current.state.fleet.supplies;
    act(() => result.current.departVoyage("lisbon-faro"));

    expect(result.current.state.voyage).toBeNull();
    expect(result.current.state.fleet.supplies).toBe(suppliesBefore);
    expect(result.current.commandError).toBe("Secure randomness is unavailable; Voyage departure was not changed.");
  });

  it("reschedules after clock rollback and applies one arrival in Strict Mode", async () => {
    vi.useFakeTimers();
    let currentNow = 100;
    let state = buySupply(createInitialGameState(0), "food", 1, 1).state;
    state = buySupply(state, "water", 1, 2).state;
    state = departVoyage(state, "lisbon-faro", 100, 3).state;
    const savedRepository = repository(createSaveEnvelope(state, 100));
    const dependencies: GameStoreDependencies = {
      repository: savedRepository,
      seedSource: fixedSeedSource,
      now: () => currentNow,
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
