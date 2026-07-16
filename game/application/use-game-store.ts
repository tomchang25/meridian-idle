"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { loadSave } from "@/game/infrastructure/persistence/save-migrations";
import { IndexedDbSaveRepository } from "@/game/infrastructure/persistence/indexed-db-save-repository";
import type { V5GameState } from "@/game/domain/models/game";
import { buySupply as applySupplyPurchase, discardSupply as applySupplyDiscard } from "@/game/domain/rules/cargo";
import { buyProduct as applyProductBuy, sellProduct as applyProductSell } from "@/game/domain/rules/market";
import { departVoyage as applyDeparture, resolveVoyage as applyVoyageResolution } from "@/game/domain/rules/voyage";
import type { SupplyId } from "@/game/domain/models/game";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable" | "corrupt";

export function useGameStore() {
  const repository = useMemo(() => new IndexedDbSaveRepository(), []);
  const [state, setState] = useState<V5GameState>(() => createInitialGameState(Date.now()));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [hydrated, setHydrated] = useState(false);
  const lastSavedState = useRef<V5GameState | null>(null);

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
          setState(createInitialGameState(Date.now()));
          setSaveStatus("saved");
        } else {
          const loaded = loadSave(raw, Date.now());
          if (loaded.kind === "corrupt") setSaveStatus("corrupt");
          else {
            setState(loaded.envelope.state);
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
  }, [repository]);

  useEffect(() => {
    if (!hydrated || saveStatus === "unavailable" || saveStatus === "corrupt") return;
    if (lastSavedState.current === state) return;
    lastSavedState.current = state;
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      void repository
        .save(state, Date.now())
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("unavailable"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, repository, saveStatus, state]);

  const acknowledgeMigration = useCallback(
    () =>
      setState((current) =>
        current.migrationReport
          ? { ...current, migrationReport: { ...current.migrationReport, acknowledged: true } }
          : current,
      ),
    [],
  );
  const startNewGame = useCallback(() => {
    setState(createInitialGameState(Date.now()));
    setSaveStatus(repository.isAvailable() ? "saved" : "unavailable");
  }, [repository]);
  const buySupply = useCallback(
    (supplyId: SupplyId, quantity: number) =>
      setState((current) => applySupplyPurchase(current, supplyId, quantity, Date.now()).state),
    [],
  );
  const discardSupply = useCallback(
    (supplyId: SupplyId, quantity: number) =>
      setState((current) => applySupplyDiscard(current, supplyId, quantity).state),
    [],
  );
  const buyProduct = useCallback(
    (productId: string) => setState((current) => applyProductBuy(current, productId, 1, Date.now()).state),
    [],
  );
  const sellProduct = useCallback(
    (productId: string) => setState((current) => applyProductSell(current, productId, 1, Date.now()).state),
    [],
  );
  const departVoyage = useCallback(
    (routeId: string) =>
      setState((current) => applyDeparture(current, routeId, Date.now(), Date.now() >>> 0 || 1).state),
    [],
  );
  const resolveVoyage = useCallback(() => setState((current) => applyVoyageResolution(current, Date.now()).state), []);
  useEffect(() => {
    if (!state.voyage) return;
    const delay = Math.max(0, state.voyage.plannedArrivesAt - Date.now());
    const timer = window.setTimeout(resolveVoyage, delay);
    return () => window.clearTimeout(timer);
  }, [resolveVoyage, state.voyage]);
  return {
    state,
    saveStatus,
    acknowledgeMigration,
    startNewGame,
    buySupply,
    discardSupply,
    buyProduct,
    sellProduct,
    departVoyage,
    resolveVoyage,
  };
}
