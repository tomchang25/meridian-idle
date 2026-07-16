import type { SeedSource } from "@/game/application/seed-source";

type CryptoRandomSource = Pick<Crypto, "getRandomValues">;

export function createCryptoSeedSource(source: CryptoRandomSource | undefined): SeedSource {
  return {
    isAvailable: () => typeof source?.getRandomValues === "function",
    nextSeed: () => {
      if (!source) return null;
      const values = new Uint32Array(1);
      for (let attempt = 0; attempt < 4; attempt += 1) {
        source.getRandomValues(values);
        if (values[0] !== 0) return values[0];
      }
      return null;
    },
  };
}

export const browserSeedSource = createCryptoSeedSource(
  typeof globalThis.crypto === "undefined" ? undefined : globalThis.crypto,
);
