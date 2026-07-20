import { describe, expect, it, vi } from "vitest";
import { createCryptoSeedSource } from "@/platform/random/crypto-seed-source";

function randomSource(values: number[]) {
  return {
    getRandomValues: vi.fn((target: Uint32Array) => {
      target[0] = values.shift() ?? 0;
      return target;
    }),
  } as unknown as Crypto;
}

describe("crypto seed source", () => {
  it("returns an injected non-zero unsigned seed", () => {
    const source = randomSource([0, 42]);
    const seeds = createCryptoSeedSource(source);
    expect(seeds.isAvailable()).toBe(true);
    expect(seeds.nextSeed()).toBe(42);
    expect(source.getRandomValues).toHaveBeenCalledTimes(2);
  });

  it("does not fall back to time when secure randomness is unavailable", () => {
    expect(createCryptoSeedSource(undefined).nextSeed()).toBeNull();
    expect(createCryptoSeedSource(randomSource([0, 0, 0, 0])).nextSeed()).toBeNull();
  });
});
