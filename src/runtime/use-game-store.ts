"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SeedSource } from "@/runtime/seed-source";
import type { SupplyId, V5GameState } from "@/core/models/game";
import {
  buySupply as applySupplyPurchase,
  discardSupply as applySupplyDiscard,
  restockSupplies as applySupplyRestock,
  setAutoRestockOnArrival as applyAutoRestockSetting,
  setSupplyTarget as applySupplyTargetSetting,
} from "@/core/rules/cargo";
import type { RuleResult } from "@/core/rules/cargo";
import { buyProduct as applyProductBuy, sellProduct as applyProductSell } from "@/core/rules/market";
import {
  departVoyage as applyDeparture,
  resolveVoyage as applyVoyageResolution,
  voyageDepartureError,
} from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { withRenderedActivity } from "@/runtime/activity-rendering";
import { systemClock, type Clock } from "@/runtime/clock";
import { IndexedDbSaveRepository } from "@/platform/persistence/indexed-db-save-repository";
import { loadSave } from "@/platform/persistence/save-migrations";
import { browserSeedSource } from "@/platform/random/crypto-seed-source";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable" | "corrupt";
export type SaveRepository = Pick<IndexedDbSaveRepository, "isAvailable" | "loadRaw" | "save">;
export type GameStoreDependencies = {
  repository?: SaveRepository;
  seedSource?: SeedSource;
  clock?: Clock;
  /** Starts from an authored world instead of hydrating a save. Harness use only. */
  initialState?: V5GameState;
};
type RuntimeGameState = { state: V5GameState; commandError: string | null };

function commandResult(result: RuleResult): RuntimeGameState {
  return { state: withRenderedActivity(result.state, result.events), commandError: result.error ?? null };
}

/** A fresh world plus the one entry that records its creation. */
function createNewGame(now: number): V5GameState {
  return withRenderedActivity(createInitialGameState(now), [{ kind: "world-created", at: now }]);
}

export function useGameStore({
  repository: providedRepository,
  seedSource = browserSeedSource,
  clock = systemClock,
  initialState,
}: GameStoreDependencies = {}) {
  const now = useCallback(() => clock.now(), [clock]);
  const repository = useMemo(() => providedRepository ?? new IndexedDbSaveRepository(), [providedRepository]);
  const [runtime, setRuntime] = useState<RuntimeGameState>(() => ({
    state: initialState ?? createNewGame(clock.now()),
    commandError: null,
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initialState ? "unavailable" : "loading");
  const [hydrated, setHydrated] = useState(Boolean(initialState));
  const lastSavedState = useRef<V5GameState | null>(null);
  const state = runtime.state;

  useEffect(() => {
    if (initialState) return;
    let active = true;
    let settled = false;
    const finishUnavailable = () => {
      if (!active || settled) return;
      settled = true;
      setSaveStatus("unavailable");
      setHydrated(true);
    };
    const timeout = window.setTimeout(finishUnavailable, 1_500);
    void repository
      .loadRaw()
      .then((raw) => {
        if (!active || settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (raw === null) {
          setRuntime({ state: createNewGame(now()), commandError: null });
          setSaveStatus("saved");
        } else {
          const loaded = loadSave(raw, now());
          if (loaded.kind === "corrupt") setSaveStatus("corrupt");
          else {
            setRuntime({ state: loaded.envelope.state, commandError: null });
            setSaveStatus("saved");
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        finishUnavailable();
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [initialState, now, repository]);

  useEffect(() => {
    if (!hydrated || saveStatus === "unavailable" || saveStatus === "corrupt") return;
    if (lastSavedState.current === state) return;
    lastSavedState.current = state;
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      void repository
        .save(state, now())
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("unavailable"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, now, repository, saveStatus, state]);

  const acknowledgeMigration = useCallback(
    () =>
      setRuntime((current) => ({
        commandError: null,
        state: current.state.migrationReport
          ? {
              ...current.state,
              migrationReport: { ...current.state.migrationReport, acknowledged: true },
            }
          : current.state,
      })),
    [],
  );
  const startNewGame = useCallback(() => {
    setRuntime({ state: createNewGame(now()), commandError: null });
    setSaveStatus(repository.isAvailable() ? "saved" : "unavailable");
  }, [now, repository]);
  const applySupplyTarget = useCallback(
    (supplyId: SupplyId) =>
      setRuntime((current) => {
        const target = current.state.fleet.supplyTargets[supplyId];
        const quantity = current.state.fleet.supplies[supplyId].quantity;
        if (target === quantity)
          return { ...current, commandError: "Supply target already matches the quantity aboard." };
        return commandResult(
          target > quantity
            ? applySupplyPurchase(current.state, supplyId, target - quantity, now())
            : applySupplyDiscard(current.state, supplyId, quantity - target),
        );
      }),
    [now],
  );
  const setSupplyTarget = useCallback(
    (supplyId: SupplyId, target: number) =>
      setRuntime((current) => commandResult(applySupplyTargetSetting(current.state, supplyId, target))),
    [],
  );
  const setAutoRestockOnArrival = useCallback(
    (enabled: boolean) => setRuntime((current) => commandResult(applyAutoRestockSetting(current.state, enabled))),
    [],
  );
  const restockAllSupplies = useCallback(
    () => setRuntime((current) => commandResult(applySupplyRestock(current.state, now()))),
    [now],
  );
  const buyProduct = useCallback(
    (productId: string, quantity: number) =>
      setRuntime((current) => commandResult(applyProductBuy(current.state, productId, quantity, now()))),
    [now],
  );
  const sellProduct = useCallback(
    (productId: string, quantity: number) =>
      setRuntime((current) => commandResult(applyProductSell(current.state, productId, quantity, now()))),
    [now],
  );
  const departVoyage = useCallback(
    (routeId: string) =>
      setRuntime((current) => {
        const eligibilityError = voyageDepartureError(current.state, routeId);
        if (eligibilityError) return { ...current, commandError: eligibilityError };
        let seed: number | null = null;
        try {
          seed = seedSource.nextSeed();
        } catch {
          seed = null;
        }
        if (seed === null)
          return { ...current, commandError: "Secure randomness is unavailable; Voyage departure was not changed." };
        return commandResult(applyDeparture(current.state, routeId, now(), seed));
      }),
    [now, seedSource],
  );
  const resolveVoyage = useCallback(
    () => setRuntime((current) => commandResult(applyVoyageResolution(current.state, now()))),
    [now],
  );
  useEffect(() => {
    if (!state.voyage) return;
    const plannedArrivesAt = state.voyage.plannedArrivesAt;
    let timer = 0;
    const resolveWhenDue = () => {
      const remaining = plannedArrivesAt - now();
      if (remaining > 0) {
        timer = window.setTimeout(resolveWhenDue, remaining);
        return;
      }
      resolveVoyage();
    };
    timer = window.setTimeout(resolveWhenDue, Math.max(0, plannedArrivesAt - now()));
    return () => window.clearTimeout(timer);
  }, [now, resolveVoyage, state.voyage]);

  let canGenerateVoyageSeed = false;
  try {
    canGenerateVoyageSeed = seedSource.isAvailable();
  } catch {
    canGenerateVoyageSeed = false;
  }
  return {
    state,
    saveStatus,
    commandError: runtime.commandError,
    canGenerateVoyageSeed,
    clock,
    resolveVoyage,
    acknowledgeMigration,
    startNewGame,
    setSupplyTarget,
    setAutoRestockOnArrival,
    applySupplyTarget,
    restockAllSupplies,
    buyProduct,
    sellProduct,
    departVoyage,
  };
}
