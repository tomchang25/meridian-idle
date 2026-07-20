import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/catalog";
import type { GameEvent } from "@/core/events/game-events";
import type { V5GameState } from "@/core/models/game";
import { createRandomStream } from "@/core/random/random-stream";
import { createRandomStreams, deriveSeed } from "@/core/random/random-streams";
import { buySupply, setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import { buyProduct } from "@/core/rules/market";
import { departVoyage, resolveVoyage } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

const VOYAGE_SEED = 3;

/**
 * One fixed command sequence against a fixed clock. Offline resolution will
 * replay exactly this shape, so the events it produces are the contract.
 */
function runCommands(from: V5GameState): { state: V5GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  let state = from;
  const step = (result: { state: V5GameState; events: readonly GameEvent[] }) => {
    state = result.state;
    events.push(...result.events);
  };

  step(buySupply(WORLD_CONTENT, state, "food", 3, 10));
  step(buySupply(WORLD_CONTENT, state, "water", 3, 20));
  step(buyProduct(WORLD_CONTENT, state, "cod", 2, 30));
  step(setSupplyTarget(state, "food", 4));
  step(setAutoRestockOnArrival(state, true));
  step(departVoyage(WORLD_CONTENT, state, "lisbon-faro", 100, VOYAGE_SEED));
  step(resolveVoyage(WORLD_CONTENT, state, 2_100));

  return { state, events };
}

describe("determinism", () => {
  it("reproduces the same event sequence from the same seed and commands", () => {
    const first = runCommands(createInitialGameState(0));
    const second = runCommands(createInitialGameState(0));

    expect(second.events).toEqual(first.events);
    expect(second.state).toEqual(first.state);
  });

  it("reproduces the same events across a save round-trip mid-sequence", () => {
    const straightThrough = runCommands(createInitialGameState(0));

    // Interrupt after departure, persist, reload, then finish the sequence.
    let interrupted = createInitialGameState(0);
    const events: GameEvent[] = [];
    const step = (result: { state: V5GameState; events: readonly GameEvent[] }) => {
      interrupted = result.state;
      events.push(...result.events);
    };
    step(buySupply(WORLD_CONTENT, interrupted, "food", 3, 10));
    step(buySupply(WORLD_CONTENT, interrupted, "water", 3, 20));
    step(buyProduct(WORLD_CONTENT, interrupted, "cod", 2, 30));
    step(setSupplyTarget(interrupted, "food", 4));
    step(setAutoRestockOnArrival(interrupted, true));
    step(departVoyage(WORLD_CONTENT, interrupted, "lisbon-faro", 100, VOYAGE_SEED));

    const loaded = loadSave(createSaveEnvelope(interrupted, 150), 150);
    expect(loaded.kind).toBe("current");
    if (loaded.kind === "corrupt") throw new Error("Round-tripped save must load.");

    step(resolveVoyage(WORLD_CONTENT, loaded.envelope.state, 2_100));

    expect(events).toEqual(straightThrough.events);
    expect(interrupted).toEqual(straightThrough.state);
  });

  it("keeps a resolution identical whether it happens on time or long after", () => {
    const onTime = runCommands(createInitialGameState(0));

    let late = createInitialGameState(0);
    const step = (result: { state: V5GameState }) => {
      late = result.state;
    };
    step(buySupply(WORLD_CONTENT, late, "food", 3, 10));
    step(buySupply(WORLD_CONTENT, late, "water", 3, 20));
    step(buyProduct(WORLD_CONTENT, late, "cod", 2, 30));
    step(setSupplyTarget(late, "food", 4));
    step(setAutoRestockOnArrival(late, true));
    step(departVoyage(WORLD_CONTENT, late, "lisbon-faro", 100, VOYAGE_SEED));
    const lateResolution = resolveVoyage(WORLD_CONTENT, late, 900_000);

    expect(lateResolution.events).toEqual(onTime.events.slice(-lateResolution.events.length));
    expect(lateResolution.state).toEqual(onTime.state);
  });
});

describe("random streams", () => {
  it("rebuilds the identical sequence from the same root seed and domain", () => {
    const draws = (rootSeed: number) => {
      const stream = createRandomStreams(rootSeed).get("market-session");
      return [stream.nextUint32(), stream.nextUint32(), stream.nextUint32()];
    };

    expect(draws(42)).toEqual(draws(42));
  });

  it("gives different domains independent sequences from one root seed", () => {
    const streams = createRandomStreams(42);
    const market = [streams.get("market-session").nextUint32(), streams.get("market-session").nextUint32()];

    // A domain that does not exist yet must not be able to shift an existing one:
    // its seed is derived independently rather than drawn from a shared cursor.
    expect(deriveSeed(42, "voyage-events")).not.toBe(deriveSeed(42, "market-session"));

    const rebuilt = createRandomStreams(42).get("market-session");
    expect([rebuilt.nextUint32(), rebuilt.nextUint32()]).toEqual(market);
  });

  it("never degenerates on a zero seed", () => {
    const stream = createRandomStream(0);
    expect(stream.nextUint32()).not.toBe(0);
    expect(stream.nextUnitInterval()).toBeGreaterThan(0);
  });
});
