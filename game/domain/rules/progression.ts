import { getProduct } from "@/game/domain/content/core-content";
import type { MarketSession, V5GameState } from "@/game/domain/models/game";
import { createMarketSession } from "@/game/domain/rules/market";

export function xpThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level <= 20) return 100 * (level - 1);
  if (level <= 50) return 1900 + 200 * (level - 20);
  if (level <= 75) return 7900 + 300 * (level - 50);
  return 15400 + 450 * (Math.min(level, 100) - 75);
}
export function portLevel(state: V5GameState, portId: string): number {
  const xp = state.portProgress[portId]?.xp ?? 0;
  for (let level = 100; level >= 1; level--) if (xp >= xpThreshold(level)) return level;
  return 1;
}
export function sessionXp(session: MarketSession): number {
  return Object.entries(session.netTrade).reduce(
    (sum, [id, quantity]) => sum + Math.abs(quantity) * (getProduct(id) ? 1 : 0),
    0,
  );
}
export function settlePortEntry(
  state: V5GameState,
  destinationPortId: string,
  seed: number,
): { state: V5GameState; xpGained: number } {
  if (destinationPortId === state.marketSession.portId) return { state, xpGained: 0 };
  const contributions = Object.entries(state.marketSession.netTrade).reduce(
    (sum, [productId, quantity]) =>
      sum +
      Math.abs(quantity) *
        (getProduct(productId)
          ? Math.max(
              1,
              Math.floor(
                getProduct(productId)!.basePrice *
                  state.marketSession.categoryFactors[getProduct(productId)!.category] +
                  0.5,
              ),
            )
          : 0),
    0,
  );
  const source = state.marketSession.portId;
  const xp = (state.portProgress[source]?.xp ?? 0) + contributions;
  const progress = {
    ...state.portProgress,
    [source]: { xp },
    [destinationPortId]: state.portProgress[destinationPortId] ?? { xp: 0 },
  };
  const destinationLevel = portLevel({ ...state, portProgress: progress }, destinationPortId);
  return {
    xpGained: contributions,
    state: {
      ...state,
      fleet: { ...state.fleet, locationPortId: destinationPortId },
      portProgress: progress,
      marketSession: createMarketSession(destinationPortId, destinationLevel, seed),
    },
  };
}
