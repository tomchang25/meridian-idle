import type { WorldContent } from "@/core/content/world-content";
import type { MarketSession, GameState } from "@/core/model/game";
import { createMarketSession } from "@/core/rules/market";

export function xpThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level <= 20) return 100 * (level - 1);
  if (level <= 50) return 1900 + 200 * (level - 20);
  if (level <= 75) return 7900 + 300 * (level - 50);
  return 15400 + 450 * (Math.min(level, 100) - 75);
}
export function portLevel(state: GameState, portId: string): number {
  const xp = state.portProgress[portId]?.xp ?? 0;
  for (let level = 100; level >= 1; level--) if (xp >= xpThreshold(level)) return level;
  return 1;
}
export function sessionXp(content: WorldContent, session: MarketSession): number {
  return Object.entries(session.netTrade).reduce(
    (sum, [id, quantity]) => sum + Math.abs(quantity) * (content.getProductFamilyForProduct(id) ? 1 : 0),
    0,
  );
}
export function settlePortEntry(
  content: WorldContent,
  state: GameState,
  destinationPortId: string,
  seed: number,
): { state: GameState; xpGained: number } {
  if (destinationPortId === state.marketSession.portId)
    return {
      state: {
        ...state,
        fleet: {
          ...state.fleet,
          locationPortId: destinationPortId,
          holdingNavPointId: null,
          holdingOriginNodeId: null,
        },
      },
      xpGained: 0,
    };
  const contributions = Object.entries(state.marketSession.netTrade).reduce((sum, [productId, quantity]) => {
    const family = content.getProductFamilyForProduct(productId);
    return (
      sum +
      Math.abs(quantity) *
        (family
          ? Math.max(1, Math.floor(family.basePrice * state.marketSession.categoryFactors[family.category] + 0.5))
          : 0)
    );
  }, 0);
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
      fleet: { ...state.fleet, locationPortId: destinationPortId, holdingNavPointId: null, holdingOriginNodeId: null },
      portProgress: progress,
      marketSession: createMarketSession(destinationPortId, destinationLevel, seed),
    },
  };
}
