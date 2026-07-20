/**
 * A reproducible source of draws. Every stream is constructed from an explicit
 * seed and owns its own cursor, so a replay can reconstruct it exactly; there is
 * deliberately no shared or ambient generator.
 */
export type RandomStream = {
  /** The next draw as an unsigned 32-bit integer. */
  nextUint32(): number;
  /** The next draw scaled to the half-open interval from zero to one. */
  nextUnitInterval(): number;
};

/** A zero state would make the shift register emit only zeros. */
function normalize(seed: number): number {
  return seed >>> 0 || 1;
}

function shift(state: number): number {
  let next = state ^ (state << 13);
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

export function createRandomStream(seed: number): RandomStream {
  let state = normalize(seed);
  const nextUint32 = () => {
    state = shift(state);
    return state;
  };
  return { nextUint32, nextUnitInterval: () => nextUint32() / 2 ** 32 };
}
