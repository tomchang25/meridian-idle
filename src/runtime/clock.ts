/**
 * The single seam for game time. Everything that needs "now" reads it through a
 * clock so tests and the debug harness can freeze or advance time; core rules
 * still receive explicit timestamps as arguments and stay free of any ambient
 * time source.
 */
export type Clock = { now(): number };

export const systemClock: Clock = { now: () => Date.now() };
