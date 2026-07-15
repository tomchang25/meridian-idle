import { describe, expect, it } from "vitest";
import { resolveElapsedAction } from "@/game/domain/rules/offline-resolver";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";

describe("resolveElapsedAction", () => {
  it("resolves completed action cycles and advances the next cycle", () => {
    const now = 1_000_000;
    const state = createInitialGameState(now - 600_000);
    state.currentAction = {
      actionId: "olive-oil-trade",
      startedAt: now - 600_000,
      cycleStartedAt: now - 600_000,
      cycleEndsAt: now - 330_000,
    };

    const result = resolveElapsedAction(state, now);

    expect(result.completedCycles).toBe(2);
    expect(result.state.resources.gold).toBe(state.resources.gold + 840);
    expect(result.state.mastery["olive-oil-trade"]).toBe(49);
    expect(result.state.currentAction?.cycleStartedAt).toBe(now - 60_000);
  });

  it("caps offline progress at eight hours", () => {
    const now = 48 * 60 * 60 * 1000;
    const state = createInitialGameState(0);
    state.currentAction = {
      actionId: "olive-oil-trade",
      startedAt: 0,
      cycleStartedAt: 0,
      cycleEndsAt: 270_000,
    };

    const result = resolveElapsedAction(state, now);

    expect(result.elapsedMs).toBe(8 * 60 * 60 * 1000);
    expect(result.completedCycles).toBe(Math.floor((8 * 60 * 60) / 270));
  });
});
