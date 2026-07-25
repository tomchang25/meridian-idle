import type { Clock } from "@/runtime/clock";
export { DEBUG_TIME_SCALE } from "@/content/navigation-definitions";

/**
 * A clock a test drives by hand. Simulated time only moves when `advance` is
 * called, so a Voyage arrival is reached in a single step instead of by waiting.
 */
export type HarnessClock = Clock & {
  advance(milliseconds: number): number;
  set(milliseconds: number): number;
};

/**
 * A fixed simulated epoch. The harness deliberately does not start from the wall
 * clock: a constant start makes a scenario reproduce identically on every run.
 */
export const HARNESS_EPOCH = 1_700_000_000_000;

export function createHarnessClock(start: number = HARNESS_EPOCH): HarnessClock {
  let current = start;
  return {
    now: () => current,
    advance(milliseconds) {
      current += Math.max(0, milliseconds);
      return current;
    },
    set(milliseconds) {
      current = milliseconds;
      return current;
    },
  };
}

/** Makes a Clock advance simulated time by a fixed multiple of its base clock. */
