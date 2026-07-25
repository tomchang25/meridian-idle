import type { SupplyId, GameState } from "@/core/model/game";
import {
  buySupply as applySupplyPurchase,
  discardSupply as applySupplyDiscard,
  restockSupplies as applySupplyRestock,
  setAutoRestockOnArrival as applyAutoRestockSetting,
  setSupplyTarget as applySupplyTargetSetting,
  type RuleResult,
} from "@/core/rules/cargo";
import { buyProduct as applyProductBuy, sellProduct as applyProductSell } from "@/core/rules/market";
import {
  breakOffAtNode as applyBreakOffAtNode,
  breakOffVoyage as applyBreakOffVoyage,
  departVoyage as applyDeparture,
  previewBreakOff,
  previewVoyagePassage,
  resolveVoyage as applyVoyageResolution,
  type BreakOffExitId,
  type BreakOffPreview,
  type VoyagePassagePreview,
} from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { WORLD_CONTENT } from "@/content/content-catalog";
import { withRenderedActivity } from "@/runtime/activity-rendering";
import { systemClock, type Clock } from "@/runtime/clock";
import type { SeedSource } from "@/runtime/seed-source";
import { loadSave } from "@/platform/persistence/save-migrations";

export type SaveStatus = "loading" | "saved" | "saving" | "unavailable" | "corrupt";

export type SaveRepository = {
  isAvailable(): boolean;
  loadRaw(): Promise<unknown>;
  save(state: GameState, savedAt: number): Promise<void>;
};

export type GameRuntimeOptions = {
  repository: SaveRepository;
  seedSource: SeedSource;
  clock?: Clock;
  /** Starts from an authored world instead of hydrating a save. Harness use only. */
  initialState?: GameState;
  /** Applies only to newly departed Voyage waiting timestamps. */
  voyagePacingMultiplier?: number;
};

export type GameSnapshot = {
  state: GameState;
  saveStatus: SaveStatus;
  commandError: string | null;
};

const HYDRATION_TIMEOUT_MS = 1_500;
const SAVE_DEBOUNCE_MS = 350;

/** A fresh world plus the one entry that records its creation. */
function createNewGame(now: number): GameState {
  return withRenderedActivity(createInitialGameState(now), [{ kind: "world-created", at: now }]);
}

/**
 * Owns game state, command dispatch, arrival scheduling, and save orchestration
 * with no framework involvement, so the same object can be driven from a test,
 * a worker, or a React subscription.
 *
 * Every asynchronous or scheduled step is stamped with the generation that
 * started it. Replacing the world — a new game, a hydrated save — bumps the
 * generation, which is how a timer or an in-flight save belonging to the
 * previous world is prevented from landing on the current one.
 */
export class GameRuntime {
  private readonly repository: SaveRepository;
  private readonly seedSource: SeedSource;
  private readonly voyagePacingMultiplier: number;
  private readonly listeners = new Set<() => void>();

  private snapshot: GameSnapshot;
  private generation = 0;
  private hydrated: boolean;
  private lastSavedState: GameState | null = null;
  private voyageTimer: ReturnType<typeof setTimeout> | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private hydrationTimer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  readonly clock: Clock;

  constructor({
    repository,
    seedSource,
    clock = systemClock,
    initialState,
    voyagePacingMultiplier = 1,
  }: GameRuntimeOptions) {
    this.repository = repository;
    this.seedSource = seedSource;
    this.clock = clock;
    this.voyagePacingMultiplier = voyagePacingMultiplier;
    this.hydrated = Boolean(initialState);
    this.snapshot = {
      state: initialState ?? createNewGame(clock.now()),
      saveStatus: initialState ? "unavailable" : "loading",
      commandError: null,
    };
    if (initialState) this.scheduleVoyageResolution();
  }

  // --- subscription -------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): GameSnapshot => this.snapshot;

  get canGenerateVoyageSeed(): boolean {
    try {
      return this.seedSource.isAvailable();
    } catch {
      return false;
    }
  }

  /** Cancels every scheduled and in-flight step; the runtime is unusable after this. */
  dispose(): void {
    this.disposed = true;
    this.generation += 1;
    this.clearTimers();
    this.listeners.clear();
  }

  // --- lifecycle ----------------------------------------------------------

  /**
   * Brings the runtime online for a mount. On first activation this hydrates the
   * persisted world; on a re-activation after `dispose` — which React does on
   * every StrictMode mount and on any remount — it clears the disposed flag and
   * re-arms the timers `dispose` cleared, so the same instance keeps working
   * instead of staying permanently dead.
   */
  activate(): void {
    this.disposed = false;
    if (!this.hydrated) {
      this.hydrate();
      return;
    }
    this.scheduleVoyageResolution();
  }

  /** Loads the persisted world. Does nothing when started from an authored one. */
  hydrate(): void {
    if (this.hydrated || this.disposed) return;
    const generation = this.generation;

    const finishUnavailable = () => {
      if (this.isStale(generation) || this.hydrated) return;
      this.hydrated = true;
      this.publish({ saveStatus: "unavailable" });
    };

    this.hydrationTimer = setTimeout(finishUnavailable, HYDRATION_TIMEOUT_MS);

    void this.repository
      .loadRaw()
      .then((raw) => {
        if (this.isStale(generation) || this.hydrated) return;
        clearTimeout(this.hydrationTimer);
        // Marked before the world is installed so the first save after
        // hydration is scheduled rather than skipped.
        this.hydrated = true;
        if (raw === null) {
          this.replaceWorld(createNewGame(this.clock.now()), "saved");
        } else {
          const loaded = loadSave(raw, this.clock.now());
          if (loaded.kind === "corrupt") this.publish({ saveStatus: "corrupt" });
          else this.replaceWorld(loaded.envelope.state, "saved");
        }
      })
      .catch(finishUnavailable);
  }

  startNewGame(): void {
    this.replaceWorld(createNewGame(this.clock.now()), this.repository.isAvailable() ? "saved" : "unavailable");
    this.hydrated = true;
  }

  // --- commands -----------------------------------------------------------

  acknowledgeMigration(): void {
    const { migrationReport } = this.snapshot.state;
    if (!migrationReport) return;
    this.commit({
      state: { ...this.snapshot.state, migrationReport: { ...migrationReport, acknowledged: true } },
      events: [],
    });
  }

  setSupplyTarget(supplyId: SupplyId, target: number): void {
    this.commit(applySupplyTargetSetting(this.snapshot.state, supplyId, target));
  }

  setAutoRestockOnArrival(enabled: boolean): void {
    this.commit(applyAutoRestockSetting(this.snapshot.state, enabled));
  }

  /** Buys up to, or discards down to, the Supply target already aboard. */
  applySupplyTarget(supplyId: SupplyId): void {
    const { state } = this.snapshot;
    const target = state.fleet.supplyTargets[supplyId];
    const quantity = state.fleet.supplies[supplyId].quantity;
    if (target === quantity) {
      this.publish({ commandError: "Supply target already matches the quantity aboard." });
      return;
    }
    this.commit(
      target > quantity
        ? applySupplyPurchase(WORLD_CONTENT, state, supplyId, target - quantity, this.clock.now())
        : applySupplyDiscard(state, supplyId, quantity - target),
    );
  }

  restockAllSupplies(): void {
    this.commit(applySupplyRestock(WORLD_CONTENT, this.snapshot.state, this.clock.now()));
  }

  buyProduct(productId: string, quantity: number): void {
    this.commit(applyProductBuy(WORLD_CONTENT, this.snapshot.state, productId, quantity, this.clock.now()));
  }

  sellProduct(productId: string, quantity: number): void {
    this.commit(applyProductSell(WORLD_CONTENT, this.snapshot.state, productId, quantity, this.clock.now()));
  }

  previewVoyage(destinationPortId: string): VoyagePassagePreview {
    return previewVoyagePassage(WORLD_CONTENT, this.snapshot.state, destinationPortId, this.voyagePacingMultiplier);
  }

  departVoyage(destinationPortId: string, quoteId: string): void {
    const { state } = this.snapshot;
    const preview = this.previewVoyage(destinationPortId);
    if (preview.error) {
      this.publish({ commandError: preview.error });
      return;
    }
    if (!preview.quoteId || preview.quoteId !== quoteId) {
      this.publish({ commandError: "This passage quote is stale. Review the latest departure details." });
      return;
    }
    let seed: number | null = null;
    try {
      seed = this.seedSource.nextSeed();
    } catch {
      seed = null;
    }
    if (seed === null) {
      this.publish({ commandError: "Secure randomness is unavailable; Voyage departure was not changed." });
      return;
    }
    this.commit(
      applyDeparture(
        WORLD_CONTENT,
        state,
        destinationPortId,
        quoteId,
        this.clock.now(),
        seed,
        this.voyagePacingMultiplier,
      ),
    );
  }

  /** Settles an arrival that is now due; a no-op while the Voyage is still at sea. */
  resolveVoyage(): void {
    this.commit(applyVoyageResolution(WORLD_CONTENT, this.snapshot.state, this.clock.now()));
  }

  previewBreakOff(): BreakOffPreview {
    return previewBreakOff(WORLD_CONTENT, this.snapshot.state, this.clock.now(), this.voyagePacingMultiplier);
  }

  breakOffVoyage(exit: BreakOffExitId, quoteId: string): void {
    let seed: number | null = null;
    try {
      seed = this.seedSource.nextSeed();
    } catch {
      seed = null;
    }
    if (seed === null) {
      this.publish({ commandError: "Secure randomness is unavailable; break-off was not changed." });
      return;
    }
    this.commit(
      applyBreakOffVoyage(
        WORLD_CONTENT,
        this.snapshot.state,
        this.clock.now(),
        exit,
        quoteId,
        seed,
        this.voyagePacingMultiplier,
      ),
    );
  }

  breakOffAtNode(quoteId: string): void {
    let seed: number | null = null;
    try {
      seed = this.seedSource.nextSeed();
    } catch {
      seed = null;
    }
    if (seed === null) {
      this.publish({ commandError: "Secure randomness is unavailable; break-off was not changed." });
      return;
    }
    this.commit(applyBreakOffAtNode(WORLD_CONTENT, this.snapshot.state, this.clock.now(), quoteId, seed));
  }

  // --- internals ----------------------------------------------------------

  private isStale(generation: number): boolean {
    return this.disposed || generation !== this.generation;
  }

  private clearTimers(): void {
    clearTimeout(this.voyageTimer);
    clearTimeout(this.saveTimer);
    clearTimeout(this.hydrationTimer);
    this.voyageTimer = undefined;
    this.saveTimer = undefined;
    this.hydrationTimer = undefined;
  }

  /** Installs a different world and abandons everything scheduled for the old one. */
  private replaceWorld(state: GameState, saveStatus: SaveStatus): void {
    this.generation += 1;
    this.clearTimers();
    this.lastSavedState = null;
    this.snapshot = { state, saveStatus, commandError: null };
    this.emit();
    this.scheduleVoyageResolution();
    this.scheduleSave();
  }

  private commit(result: RuleResult): void {
    if (this.disposed) return;
    const state = withRenderedActivity(result.state, result.events);
    const changed = state !== this.snapshot.state;
    this.snapshot = { ...this.snapshot, state, commandError: result.error ?? null };
    this.emit();
    if (changed) {
      this.scheduleVoyageResolution();
      this.scheduleSave();
    }
  }

  private publish(patch: Partial<GameSnapshot>): void {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, commandError: null, ...patch };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  /** Wakes at the next canonical Voyage boundary; timers never define elapsed progress. */
  private scheduleVoyageResolution(): void {
    clearTimeout(this.voyageTimer);
    this.voyageTimer = undefined;
    const voyage = this.snapshot.state.voyage;
    if (!voyage || this.disposed) return;

    const generation = this.generation;
    const wake = () => {
      if (this.isStale(generation)) return;
      const remaining = voyage.progress.nextBoundaryAt - this.clock.now();
      if (remaining > 0) {
        this.voyageTimer = setTimeout(wake, remaining);
        return;
      }
      this.resolveVoyage();
    };
    this.voyageTimer = setTimeout(wake, Math.max(0, voyage.progress.nextBoundaryAt - this.clock.now()));
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    const { state, saveStatus } = this.snapshot;
    if (!this.hydrated || saveStatus === "unavailable" || saveStatus === "corrupt") return;
    if (this.lastSavedState === state) return;

    this.lastSavedState = state;
    const generation = this.generation;
    this.saveTimer = setTimeout(() => {
      if (this.isStale(generation)) return;
      this.publish({ saveStatus: "saving" });
      void this.repository
        .save(state, this.clock.now())
        .then(() => {
          if (this.isStale(generation)) return;
          this.publish({ saveStatus: "saved" });
        })
        .catch(() => {
          if (this.isStale(generation)) return;
          this.publish({ saveStatus: "unavailable" });
        });
    }, SAVE_DEBOUNCE_MS);
  }
}
