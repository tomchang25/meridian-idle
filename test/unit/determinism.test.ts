import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/content-catalog";
import type { GameEvent } from "@/core/events/game-events";
import type { GameState } from "@/core/model/game";
import { createRandomStream } from "@/core/random/random-stream";
import { createRandomStreams, deriveSeed } from "@/core/random/random-streams";
import { buySupply, setAutoRestockOnArrival, setSupplyTarget } from "@/core/rules/cargo";
import { buyProduct } from "@/core/rules/market";
import {
  breakOffVoyage,
  departVoyage,
  previewBreakOff,
  previewVoyagePassage,
  resolveVoyage,
} from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { createSaveEnvelope, loadSave } from "@/platform/persistence/save-migrations";

const VOYAGE_SEED = 3;

function departForFaro(state: GameState) {
  const preview = previewVoyagePassage(WORLD_CONTENT, state, "faro", 20);
  if (!preview.quoteId) throw new Error("Expected Lisbon-to-Faro quote.");
  return departVoyage(WORLD_CONTENT, state, "faro", preview.quoteId, 100, VOYAGE_SEED, 20);
}

/**
 * One fixed command sequence against a fixed clock. Offline resolution will
 * replay exactly this shape, so the events it produces are the contract.
 */
function runCommands(from: GameState): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  let state = from;
  const step = (result: { state: GameState; events: readonly GameEvent[] }) => {
    state = result.state;
    events.push(...result.events);
  };

  step(buySupply(WORLD_CONTENT, state, "food", 3, 10));
  step(buySupply(WORLD_CONTENT, state, "water", 3, 20));
  step(buyProduct(WORLD_CONTENT, state, "cod", 2, 30));
  step(setSupplyTarget(state, "food", 4));
  step(setAutoRestockOnArrival(state, true));
  step(departForFaro(state));
  step(resolveVoyage(WORLD_CONTENT, state, 2_100));

  return { state, events };
}

describe("determinism", () => {
  it("matches whole-unit Supply consumption across one-shot and incremental sailing resolution", () => {
    let state = buySupply(WORLD_CONTENT, createInitialGameState(0), "food", 2, 10).state;
    state = buySupply(WORLD_CONTENT, state, "water", 2, 20).state;
    state = { ...state, fleet: { ...state.fleet, speed: 50 } };
    const preview = previewVoyagePassage(WORLD_CONTENT, state, "faro", 20);
    if (!preview.quoteId) throw new Error("Expected a slow Lisbon-to-Faro quote.");
    const departed = departVoyage(WORLD_CONTENT, state, "faro", preview.quoteId, 100, VOYAGE_SEED, 20).state;

    const incremental = resolveVoyage(WORLD_CONTENT, resolveVoyage(WORLD_CONTENT, departed, 2_600).state, 4_100).state;
    const oneShot = resolveVoyage(WORLD_CONTENT, departed, 4_100).state;

    expect(incremental).toEqual(oneShot);
    expect(oneShot.latestVoyageResult?.supplyCost).toBe(24);
  });

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
    const step = (result: { state: GameState; events: readonly GameEvent[] }) => {
      interrupted = result.state;
      events.push(...result.events);
    };
    step(buySupply(WORLD_CONTENT, interrupted, "food", 3, 10));
    step(buySupply(WORLD_CONTENT, interrupted, "water", 3, 20));
    step(buyProduct(WORLD_CONTENT, interrupted, "cod", 2, 30));
    step(setSupplyTarget(interrupted, "food", 4));
    step(setAutoRestockOnArrival(interrupted, true));
    step(departForFaro(interrupted));

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
    const step = (result: { state: GameState }) => {
      late = result.state;
    };
    step(buySupply(WORLD_CONTENT, late, "food", 3, 10));
    step(buySupply(WORLD_CONTENT, late, "water", 3, 20));
    step(buyProduct(WORLD_CONTENT, late, "cod", 2, 30));
    step(setSupplyTarget(late, "food", 4));
    step(setAutoRestockOnArrival(late, true));
    step(departForFaro(late));
    const lateResolution = resolveVoyage(WORLD_CONTENT, late, 900_000);

    expect(lateResolution.events).toEqual(onTime.events.slice(-lateResolution.events.length));
    expect(lateResolution.state).toEqual(onTime.state);
  });

  function runBreakOffCommands(from: GameState): { state: GameState; events: GameEvent[] } {
    const events: GameEvent[] = [];
    let state = from;
    const step = (result: { state: GameState; events: readonly GameEvent[] }) => {
      state = result.state;
      events.push(...result.events);
    };

    step(buySupply(WORLD_CONTENT, state, "food", 2, 10));
    step(buySupply(WORLD_CONTENT, state, "water", 2, 20));
    step(departForFaro(state));
    const preview = previewBreakOff(WORLD_CONTENT, state, 600, 20);
    if (preview.kind !== "mid-edge") throw new Error("Expected a mid-edge break-off preview.");
    step(breakOffVoyage(WORLD_CONTENT, state, 600, "next", preview.next.quoteId!, 5, 20));

    return { state, events };
  }

  it("reproduces the same break-off connector and holding outcome across runs, save round-trip, and offline resolution", () => {
    const firstRun = runBreakOffCommands(createInitialGameState(0));
    const first = { state: resolveVoyage(WORLD_CONTENT, firstRun.state, 2_000).state, events: firstRun.events };
    const second = runBreakOffCommands(createInitialGameState(0));
    expect(second.events).toEqual(firstRun.events);
    expect(second.state).toEqual(firstRun.state);
    expect(first.state.fleet.holdingNavPointId).toBe("cape-st-vincent");

    const roundTripped = runBreakOffCommands(createInitialGameState(0));
    const loaded = loadSave(createSaveEnvelope(roundTripped.state, 600), 600);
    expect(loaded.kind).toBe("current");
    if (loaded.kind === "corrupt") throw new Error("Round-tripped save must load.");
    expect(resolveVoyage(WORLD_CONTENT, loaded.envelope.state, 2_000).state).toEqual(first.state);

    const offline = runBreakOffCommands(createInitialGameState(0));
    expect(resolveVoyage(WORLD_CONTENT, offline.state, 900_000).state).toEqual(first.state);
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
