"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { loadSave } from "@/game/infrastructure/persistence/save-migrations";
import { IndexedDbSaveRepository } from "@/game/infrastructure/persistence/indexed-db-save-repository";
import type { V5GameState } from "@/game/domain/models/game";
import { buySupply as applySupplyPurchase, discardSupply as applySupplyDiscard } from "@/game/domain/rules/cargo";
import type { SupplyId } from "@/game/domain/models/game";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable" | "corrupt";

export function useGameStore() {
  const repository = useMemo(() => new IndexedDbSaveRepository(), []);
  const [state, setState] = useState<V5GameState>(() => createInitialGameState(Date.now()));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void repository
      .loadRaw()
      .then((raw) => {
        if (!active) return;
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
        if (active) {
          setSaveStatus("unavailable");
          setHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!hydrated || saveStatus === "unavailable" || saveStatus === "corrupt") return;
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
  return { state, saveStatus, acknowledgeMigration, startNewGame, buySupply, discardSupply };
}
