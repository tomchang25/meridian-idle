import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { V5GameState } from "@/game/domain/models/game";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { MeridianDashboard } from "@/game/features/dashboard/meridian-dashboard";

const store = {
  state: {
    ...createInitialGameState(0),
    migrationReport: { fromVersion: 1 as const, migratedAt: 0, acknowledged: false, droppedFields: ["Captain"] },
  } as V5GameState,
  saveStatus: "saved" as const,
  commandError: null as string | null,
  canGenerateVoyageSeed: true,
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
  beforeEach(() => {
    store.state = {
      ...createInitialGameState(0),
      migrationReport: { fromVersion: 1, migratedAt: 0, acknowledged: false, droppedFields: ["Captain"] },
    };
    store.commandError = null;
    store.canGenerateVoyageSeed = true;
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it("renders Lisbon, market controls, and acknowledges a migration report", () => {
    render(<MeridianDashboard />);
    expect(screen.getByRole("heading", { name: "Lisbon" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Market" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole("button", { name: "Buy 1" })[0]);
    expect(store.buyProduct).toHaveBeenCalled();
  });

  it("disables Product and Supply purchases with an associated Gold reason", () => {
    store.state.fleet.gold = 0;
    render(<MeridianDashboard />);
    const codRow = screen.getByText("Cod").closest("li");
    const foodRow = screen.getByText(/^food:/).closest("li");
    expect(codRow).not.toBeNull();
    expect(foodRow).not.toBeNull();
    expect(within(codRow!).getByRole("button", { name: "Buy 1" })).toBeDisabled();
    expect(within(codRow!).getByText(/Requires 20 Gold; only 0 is available/)).toBeVisible();
    expect(within(foodRow!).getByRole("button", { name: "Buy 1" })).toBeDisabled();
    expect(within(foodRow!).getByText(/Requires 8 Gold; only 0 is available/)).toBeVisible();
  });

  it("announces an application command error", () => {
    store.commandError = "Secure randomness is unavailable.";
    render(<MeridianDashboard />);
    expect(screen.getByRole("alert")).toHaveTextContent("Command failed: Secure randomness is unavailable.");
  });
});
