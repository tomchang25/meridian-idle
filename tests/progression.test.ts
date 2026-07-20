import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { settlePortEntry, portLevel, xpThreshold } from "@/core/rules/progression";
describe("port progression", () => {
  it("settles only into a different port using persisted market reference", () => {
    const state = createInitialGameState(0);
    state.marketSession.netTrade = { cod: 2, "iron-ingot": -1 };
    const moved = settlePortEntry(state, "faro", 12);
    expect(moved.xpGained).toBe(190);
    expect(moved.state.portProgress.lisbon.xp).toBe(190);
    expect(settlePortEntry(moved.state, "faro", 14).xpGained).toBe(0);
  });
  it("derives levels from authored boundaries", () => {
    const state = createInitialGameState(0);
    state.portProgress.lisbon.xp = xpThreshold(50);
    expect(portLevel(state, "lisbon")).toBe(50);
  });
});
