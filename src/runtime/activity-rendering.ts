import type { GameEvent } from "@/core/events/game-events";
import type { ActivityEntry, GameState } from "@/core/model/game";

/** The single owner of how many activity rows the player keeps. */
export const ACTIVITY_LIMIT = 24;

/**
 * The single owner of player-facing activity copy. Domain rules report facts as
 * events; identifier, message, and tone are derived here so copy has one home.
 */
export function activityEntryFor(event: GameEvent): ActivityEntry {
  switch (event.kind) {
    case "world-created":
      return { id: `world-created-${event.at}`, at: event.at, message: "Fleet is docked at Lisbon.", tone: "info" };
    case "supply-bought":
      return {
        id: `supply-${event.at}`,
        at: event.at,
        message: `Bought ${event.quantity} ${event.supplyId}.`,
        tone: "success",
      };
    case "supplies-restocked":
      return {
        id: event.cause.kind === "voyage-arrival" ? `${event.cause.voyageId}-restocked` : `supply-restock-${event.at}`,
        at: event.at,
        message: `Restocked ${event.quantity} Supply units.`,
        tone: "success",
      };
    case "product-bought":
      return {
        id: `buy-${event.productId}-${event.at}`,
        at: event.at,
        message: `Bought ${event.quantity} ${event.productName} for ${event.cost} Gold.`,
        tone: "success",
      };
    case "product-sold":
      return {
        id: `sell-${event.productId}-${event.at}`,
        at: event.at,
        message: `Sold ${event.quantity} ${event.productId}: ${event.revenue} Gold, ${event.profit >= 0 ? "+" : ""}${event.profit} profit.`,
        tone: "success",
      };
    case "voyage-departed":
      return {
        id: event.voyageId,
        at: event.at,
        message: `Departed for ${event.destinationPortId}.`,
        tone: "info",
      };
    case "voyage-arrived":
      return {
        id: `${event.voyageId}-arrived`,
        at: event.at,
        message: `Arrived at ${event.destinationPortId}.`,
        tone: "success",
      };
    case "voyage-reached-nav-point":
      return {
        id: `${event.voyageId}-nav-point`,
        at: event.at,
        message: `Holding position at ${event.navPointId}.`,
        tone: "info",
      };
    case "voyage-auto-restock-failed":
      return {
        id: `${event.voyageId}-restock-failed`,
        at: event.at,
        message: `Auto-restock failed: ${event.reason}`,
        tone: "warning",
      };
  }
}

/**
 * Folds chronological events into the activity feed. Each entry is prepended in
 * order, so the newest event ends up first, and the cap is applied once.
 */
export function appendActivity(activity: readonly ActivityEntry[], events: readonly GameEvent[]): ActivityEntry[] {
  if (events.length === 0) return [...activity];
  const prepended = events.map(activityEntryFor).reverse();
  return [...prepended, ...activity].slice(0, ACTIVITY_LIMIT);
}

/** Applies a rule's events to the state it produced. */
export function withRenderedActivity(state: GameState, events: readonly GameEvent[]): GameState {
  if (events.length === 0) return state;
  return { ...state, activity: appendActivity(state.activity, events) };
}
