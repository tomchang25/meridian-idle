import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { SupplyId, GameState } from "@/core/model/game";
import { GameRuntime, type SaveRepository, type SaveStatus } from "@/runtime/game-runtime";
import type { Clock } from "@/runtime/clock";
import type { SeedSource } from "@/runtime/seed-source";
import { IndexedDbSaveRepository } from "@/platform/persistence/indexed-db-save-repository";
import { browserSeedSource } from "@/platform/random/crypto-seed-source";

export type { SaveRepository, SaveStatus };
export type GameStoreDependencies = {
  repository?: SaveRepository;
  seedSource?: SeedSource;
  clock?: Clock;
  /** Starts from an authored world instead of hydrating a save. Harness use only. */
  initialState?: GameState;
  voyagePacingMultiplier?: number;
};

/**
 * Subscribes React to a runtime that owns the game. The hook holds no state of
 * its own: everything scheduled or in flight belongs to the runtime, so React
 * re-rendering never affects the world and unmounting disposes it cleanly.
 */
export function useGameStore({
  repository: providedRepository,
  seedSource = browserSeedSource,
  clock,
  initialState,
  voyagePacingMultiplier,
}: GameStoreDependencies = {}) {
  // Created once per mount, deliberately not keyed on dependency identity:
  // callers commonly pass inline objects, and rebuilding the runtime mid-life
  // would abandon a pending hydration or an unsaved world.
  const [runtime] = useState(
    () =>
      new GameRuntime({
        repository: providedRepository ?? new IndexedDbSaveRepository(),
        seedSource,
        clock,
        initialState,
        voyagePacingMultiplier,
      }),
  );

  useEffect(() => {
    runtime.activate();
    return () => runtime.dispose();
  }, [runtime]);

  const snapshot = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);

  return useMemo(
    () => ({
      state: snapshot.state,
      saveStatus: snapshot.saveStatus,
      commandError: snapshot.commandError,
      canGenerateVoyageSeed: runtime.canGenerateVoyageSeed,
      clock: runtime.clock,
      resolveVoyage: () => runtime.resolveVoyage(),
      acknowledgeMigration: () => runtime.acknowledgeMigration(),
      startNewGame: () => runtime.startNewGame(),
      setSupplyTarget: (supplyId: SupplyId, target: number) => runtime.setSupplyTarget(supplyId, target),
      setAutoRestockOnArrival: (enabled: boolean) => runtime.setAutoRestockOnArrival(enabled),
      applySupplyTarget: (supplyId: SupplyId) => runtime.applySupplyTarget(supplyId),
      restockAllSupplies: () => runtime.restockAllSupplies(),
      buyProduct: (productId: string, quantity: number) => runtime.buyProduct(productId, quantity),
      sellProduct: (productId: string, quantity: number) => runtime.sellProduct(productId, quantity),
      previewVoyage: (destinationPortId: string) => runtime.previewVoyage(destinationPortId),
      departVoyage: (destinationPortId: string, quoteId: string) => runtime.departVoyage(destinationPortId, quoteId),
    }),
    [runtime, snapshot],
  );
}
