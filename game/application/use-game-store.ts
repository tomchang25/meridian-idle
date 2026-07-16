"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SeedSource } from "@/game/application/seed-source";
import type { SupplyId, V5GameState } from "@/game/domain/models/game";
import { buySupply as applySupplyPurchase, discardSupply as applySupplyDiscard } from "@/game/domain/rules/cargo";
import type { RuleResult } from "@/game/domain/rules/cargo";
import { buyProduct as applyProductBuy, sellProduct as applyProductSell } from "@/game/domain/rules/market";
import {
  departVoyage as applyDeparture,
  resolveVoyage as applyVoyageResolution,
  voyageDepartureError,
} from "@/game/domain/rules/voyage";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { IndexedDbSaveRepository } from "@/game/infrastructure/persistence/indexed-db-save-repository";
import { loadSave } from "@/game/infrastructure/persistence/save-migrations";
import { browserSeedSource } from "@/game/infrastructure/random/crypto-seed-source";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable" | "corrupt";
export type SaveRepository = Pick<IndexedDbSaveRepository, "isAvailable" | "loadRaw" | "save">;
export type GameStoreDependencies = {
  repository?: SaveRepository;
  seedSource?: SeedSource;
  now?: () => number;
};
type RuntimeGameState = { state: V5GameState; commandError: string | null };

function commandResult(result: RuleResult): RuntimeGameState {
  return { state: result.state, commandError: result.error ?? null };
}

export function useGameStore({
  repository: providedRepository,
  seedSource = browserSeedSource,
  now = Date.now,
}: GameStoreDependencies = {}) {
  const repository = useMemo(() => providedRepository ?? new IndexedDbSaveRepository(), [providedRepository]);
  const [runtime, setRuntime] = useState<RuntimeGameState>(() => ({
    state: createInitialGameState(now()),
    commandError: null,
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const lastSavedState = useRef<V5GameState | null>(null);
  const state = runtime.state;

  useEffect(() => {
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
          setRuntime({ state: createInitialGameState(now()), commandError: null });
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
  }, [now, repository]);

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
    setRuntime({ state: createInitialGameState(now()), commandError: null });
    setSaveStatus(repository.isAvailable() ? "saved" : "unavailable");
  }, [now, repository]);
  const buySupply = useCallback(
    (supplyId: SupplyId, quantity: number) =>
      setRuntime((current) => commandResult(applySupplyPurchase(current.state, supplyId, quantity, now()))),
    [now],
  );
  const discardSupply = useCallback(
    (supplyId: SupplyId, quantity: number) =>
      setRuntime((current) => commandResult(applySupplyDiscard(current.state, supplyId, quantity))),
    [],
  );
  const buyProduct = useCallback(
    (productId: string) => setRuntime((current) => commandResult(applyProductBuy(current.state, productId, 1, now()))),
    [now],
  );
  const sellProduct = useCallback(
    (productId: string) => setRuntime((current) => commandResult(applyProductSell(current.state, productId, 1, now()))),
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
    acknowledgeMigration,
    startNewGame,
    buySupply,
    discardSupply,
    buyProduct,
    sellProduct,
    departVoyage,
  };
}
