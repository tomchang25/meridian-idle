import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { createSaveEnvelope, migrateSave } from "@/game/infrastructure/persistence/save-migrations";

describe("save migrations", () => {
  it("round-trips the current save envelope", () => {
    const state = createInitialGameState(100);
    state.resources.gold = 99_999;

    const migrated = migrateSave(createSaveEnvelope(state, 200), 300);

    expect(migrated?.version).toBe(1);
    expect(migrated?.savedAt).toBe(200);
    expect(migrated?.state.resources.gold).toBe(99_999);
  });

  it("rejects unknown versions instead of guessing", () => {
    expect(migrateSave({ version: 99, state: {} })).toBeNull();
  });
});
