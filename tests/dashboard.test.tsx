import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MeridianDashboard } from "@/game/features/dashboard/meridian-dashboard";

const store = {
  state: {
    fleet: {
      gold: 99,
      hp: 100,
      maxHp: 100,
      attack: 10,
      cargoCapacity: 60,
      locationPortId: "lisbon",
      supplies: {
        food: { quantity: 0 },
        water: { quantity: 0 },
        medicine: { quantity: 0 },
        rope: { quantity: 0 },
        sails: { quantity: 0 },
      },
    },
    migrationReport: { acknowledged: false, droppedFields: ["Captain"] },
  },
  saveStatus: "saved" as const,
  acknowledgeMigration: vi.fn(),
  startNewGame: vi.fn(),
  buySupply: vi.fn(),
};

vi.mock("@/game/application/use-game-store", () => ({ useGameStore: () => store }));

describe("MeridianDashboard", () => {
  it("renders Lisbon and acknowledges a migration report", () => {
    render(<MeridianDashboard />);
    expect(screen.getByRole("heading", { name: "Lisbon" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();
  });
});
