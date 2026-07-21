import { describe, expect, it } from "vitest";
import type { GameEvent } from "@/core/events/game-events";
import type { ActivityEntry } from "@/core/model/game";
import { ACTIVITY_LIMIT, activityEntryFor, appendActivity } from "@/runtime/activity-rendering";

/**
 * This suite is the single owner of rendered activity copy. Domain rules assert
 * events; the exact identifier, message, and tone a player sees are pinned here.
 */
describe("activity rendering", () => {
  it("renders every event kind with its identifier, message, and tone", () => {
    const cases: Array<[GameEvent, ActivityEntry]> = [
      [
        { kind: "world-created", at: 5 },
        { id: "world-created-5", at: 5, message: "Fleet is docked at Lisbon.", tone: "info" },
      ],
      [
        { kind: "supply-bought", at: 10, supplyId: "food", quantity: 3 },
        { id: "supply-10", at: 10, message: "Bought 3 food.", tone: "success" },
      ],
      [
        { kind: "supplies-restocked", at: 20, quantity: 5, cause: { kind: "manual" } },
        { id: "supply-restock-20", at: 20, message: "Restocked 5 Supply units.", tone: "success" },
      ],
      [
        { kind: "supplies-restocked", at: 30, quantity: 2, cause: { kind: "voyage-arrival", voyageId: "voyage-x" } },
        { id: "voyage-x-restocked", at: 30, message: "Restocked 2 Supply units.", tone: "success" },
      ],
      [
        { kind: "product-bought", at: 40, productId: "wine", productName: "Wine", quantity: 4, cost: 120 },
        { id: "buy-wine-40", at: 40, message: "Bought 4 Wine for 120 Gold.", tone: "success" },
      ],
      [
        { kind: "product-sold", at: 50, productId: "wine", quantity: 4, revenue: 200, profit: 80 },
        { id: "sell-wine-50", at: 50, message: "Sold 4 wine: 200 Gold, +80 profit.", tone: "success" },
      ],
      [
        { kind: "product-sold", at: 60, productId: "wine", quantity: 4, revenue: 40, profit: -80 },
        { id: "sell-wine-60", at: 60, message: "Sold 4 wine: 40 Gold, -80 profit.", tone: "success" },
      ],
      [
        { kind: "voyage-departed", at: 70, voyageId: "voyage-x", destinationPortId: "faro" },
        { id: "voyage-x", at: 70, message: "Departed for faro.", tone: "info" },
      ],
      [
        { kind: "voyage-arrived", at: 80, voyageId: "voyage-x", destinationPortId: "faro" },
        { id: "voyage-x-arrived", at: 80, message: "Arrived at faro.", tone: "success" },
      ],
      [
        { kind: "voyage-auto-restock-failed", at: 90, voyageId: "voyage-x", reason: "Not enough Gold." },
        { id: "voyage-x-restock-failed", at: 90, message: "Auto-restock failed: Not enough Gold.", tone: "warning" },
      ],
    ];

    for (const [event, expected] of cases) expect(activityEntryFor(event)).toEqual(expected);
  });

  it("prepends chronological events so the newest lands first", () => {
    const existing: ActivityEntry[] = [{ id: "old", at: 0, message: "Older.", tone: "info" }];
    const rendered = appendActivity(existing, [
      { kind: "voyage-auto-restock-failed", at: 1, voyageId: "voyage-x", reason: "Not enough Gold." },
      { kind: "voyage-arrived", at: 1, voyageId: "voyage-x", destinationPortId: "faro" },
    ]);

    expect(rendered.map((entry) => entry.id)).toEqual(["voyage-x-arrived", "voyage-x-restock-failed", "old"]);
  });

  it("keeps the feed at the cap and leaves an empty event list untouched", () => {
    const existing: ActivityEntry[] = Array.from({ length: ACTIVITY_LIMIT }, (_unused, index) => ({
      id: `old-${index}`,
      at: index,
      message: "Older.",
      tone: "info" as const,
    }));

    const rendered = appendActivity(existing, [{ kind: "supply-bought", at: 99, supplyId: "food", quantity: 1 }]);
    expect(rendered).toHaveLength(ACTIVITY_LIMIT);
    expect(rendered[0].id).toBe("supply-99");
    expect(appendActivity(existing, [])).toEqual(existing);
  });
});
