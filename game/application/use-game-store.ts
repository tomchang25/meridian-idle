"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getActionDefinition } from "@/game/domain/content/actions";
import type { ActionFilter, GameLogEntry, GameState } from "@/game/domain/models/game";
import { getActionStatus } from "@/game/domain/rules/action-selectors";
import { resolveElapsedAction } from "@/game/domain/rules/offline-resolver";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { IndexedDbSaveRepository } from "@/game/infrastructure/persistence/indexed-db-save-repository";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable";

export function useGameStore() {
  const repository = useMemo(() => new IndexedDbSaveRepository(), []);
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    void repository
      .load()
      .then((save) => {
        if (cancelled) return;
        const currentTime = Date.now();
        const loaded = save?.state ?? createInitialGameState(currentTime);
        const resolution = resolveElapsedAction(loaded, currentTime);
        setState({ ...resolution.state, lastSavedAt: currentTime });
        setNow(currentTime);
        setSaveStatus(repository.isAvailable() ? "saved" : "unavailable");
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSaveStatus("unavailable");
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setState((current) => resolveElapsedAction(current, currentTime).state);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !repository.isAvailable()) return;
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      void repository
        .save(state)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("unavailable"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, repository, state]);

  const startAction = useCallback((actionId: string) => {
    setState((current) => {
      const action = getActionDefinition(actionId);
      if (!action || getActionStatus(action, current) === "locked") return current;
      const startedAt = Date.now();
      const logEntry: GameLogEntry = {
        id: `start-${startedAt}`,
        at: startedAt,
        message: `開始執行：${action.name}`,
        tone: "info",
      };
      return {
        ...current,
        currentAction: {
          actionId,
          startedAt,
          cycleStartedAt: startedAt,
          cycleEndsAt: startedAt + action.durationSec * 1000,
        },
        eventLog: [logEntry, ...current.eventLog].slice(0, 24),
      };
    });
  }, []);

  const stopAction = useCallback(() => {
    setState((current) => {
      const stoppedAt = Date.now();
      const logEntry: GameLogEntry = {
        id: `stop-${stoppedAt}`,
        at: stoppedAt,
        message: "目前行動已停止。",
        tone: "warning",
      };
      return {
        ...current,
        currentAction: null,
        eventLog: [logEntry, ...current.eventLog].slice(0, 24),
      };
    });
  }, []);

  const selectRegion = useCallback((regionId: string) => {
    setState((current) => ({ ...current, selectedRegionId: regionId }));
  }, []);

  const selectCategory = useCallback((category: ActionFilter) => {
    setState((current) => ({ ...current, selectedCategory: category }));
  }, []);

  return { state, now, saveStatus, startAction, stopAction, selectRegion, selectCategory };
}
