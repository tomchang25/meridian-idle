import { createRandomStream, type RandomStream } from "@/core/random/random-stream";

/**
 * Named domains that draw randomness. Adding one here must never shift another
 * domain's sequence, which is why each derives its own seed from the root rather
 * than sharing a cursor.
 */
export type RandomDomain = "market-session";

/**
 * Mixes a domain name into the root seed. Pure in both arguments, so the same
 * root seed and domain always rebuild the same stream during a replay.
 */
export function deriveSeed(rootSeed: number, domain: string): number {
  // FNV-1a over the domain name, then folded with the root seed.
  let hash = 0x811c9dc5;
  for (let index = 0; index < domain.length; index += 1) {
    hash ^= domain.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash ^ (rootSeed >>> 0)) >>> 0 || 1;
}

export type RandomStreams = {
  get(domain: RandomDomain): RandomStream;
};

/** Builds independent per-domain streams from one persisted root seed. */
export function createRandomStreams(rootSeed: number): RandomStreams {
  const streams = new Map<string, RandomStream>();
  return {
    get(domain) {
      const existing = streams.get(domain);
      if (existing) return existing;
      const created = createRandomStream(deriveSeed(rootSeed, domain));
      streams.set(domain, created);
      return created;
    },
  };
}
