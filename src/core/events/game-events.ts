import type { SupplyId } from "@/core/model/game";

/**
 * Why a Supply restock happened. The renderer derives the activity identifier
 * from this, so rules never name an activity row.
 */
export type SupplyRestockCause = { kind: "manual" } | { kind: "voyage-arrival"; voyageId: string };

/**
 * What a rule did, stated as a domain fact rather than as display text. Every
 * event carries its own timestamp because some outcomes are stamped with a
 * planned time rather than the current one.
 */
export type GameEvent = { at: number } & (
  | { kind: "world-created" }
  | { kind: "supply-bought"; supplyId: SupplyId; quantity: number }
  | { kind: "supplies-restocked"; quantity: number; cause: SupplyRestockCause }
  | { kind: "product-bought"; productId: string; productName: string; quantity: number; cost: number }
  | { kind: "product-sold"; productId: string; quantity: number; revenue: number; profit: number }
  | { kind: "voyage-departed"; voyageId: string; destinationPortId: string }
  | { kind: "voyage-arrived"; voyageId: string; destinationPortId: string }
  | { kind: "voyage-auto-restock-failed"; voyageId: string; reason: string }
);

export type GameEventKind = GameEvent["kind"];
