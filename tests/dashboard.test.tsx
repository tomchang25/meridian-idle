import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { MeridianDashboard } from "@/game/features/dashboard/meridian-dashboard";

const store = {
  state: {
    ...createInitialGameState(0),
    migrationReport: { fromVersion: 1 as const, migratedAt: 0, acknowledged: false, droppedFields: ["Captain"] },
  },
  saveStatus: "saved" as const,
  acknowledgeMigration: vi.fn(),
  startNewGame: vi.fn(),
  buySupply: vi.fn(),
  discardSupply: vi.fn(),
  buyProduct: vi.fn(),
  sellProduct: vi.fn(),
  departVoyage: vi.fn(),
  resolveVoyage: vi.fn(),
};
vi.mock("@/game/application/use-game-store", () => ({ useGameStore: () => store }));
describe("MeridianDashboard", () => {
  it("renders Lisbon, market controls, and acknowledges a migration report", () => {
    render(<MeridianDashboard />);
    expect(screen.getByRole("heading", { name: "Lisbon" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Market" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole("button", { name: "Buy 1" })[0]);
    expect(store.buyProduct).toHaveBeenCalled();
  });
});
