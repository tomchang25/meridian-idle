import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveStatus } from "@/game/application/use-game-store";
import type { V5GameState } from "@/game/domain/models/game";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { MeridianDashboard } from "@/game/features/dashboard/meridian-dashboard";

const store = {
  state: {
    ...createInitialGameState(0),
    migrationReport: { fromVersion: 1 as const, migratedAt: 0, acknowledged: false, droppedFields: ["Captain"] },
  } as V5GameState,
  saveStatus: "saved" as SaveStatus,
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
    store.saveStatus = "saved";
    store.commandError = null;
    store.canGenerateVoyageSeed = true;
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("renders the docked workspace and wires market and migration commands", () => {
    render(<MeridianDashboard />);

    expect(screen.getByRole("heading", { name: "Lisbon" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Market" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Product Cargo" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Provisioning" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Routes" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole("button", { name: "Buy 1" })[0]);
    expect(store.buyProduct).toHaveBeenCalledWith("cod");
  });

  it("disables Product and Supply purchases with visible associated Gold reasons", () => {
    store.state.fleet.gold = 0;
    render(<MeridianDashboard />);

    const codRow = screen.getByText("Cod").closest("li");
    const foodRow = screen.getByText("Food").closest("li");
    expect(codRow).not.toBeNull();
    expect(foodRow).not.toBeNull();

    const productBuy = within(codRow!).getByRole("button", { name: "Buy 1" });
    const supplyBuy = within(foodRow!).getByRole("button", { name: "Buy 1" });
    expect(productBuy).toBeDisabled();
    expect(productBuy).toHaveAccessibleDescription(/Requires 20 Gold; only 0 is available/);
    expect(supplyBuy).toBeDisabled();
    expect(supplyBuy).toHaveAccessibleDescription(/Requires 8 Gold; only 0 is available/);
  });

  it("announces application command errors without replacing the workspace", () => {
    store.commandError = "Secure randomness is unavailable.";
    render(<MeridianDashboard />);

    expect(screen.getByRole("alert")).toHaveTextContent("Command failed: Secure randomness is unavailable.");
    expect(screen.getByRole("heading", { name: "Market" })).toBeVisible();
  });

  it("renders distinct loading and corrupt recovery states", () => {
    store.saveStatus = "loading";
    const { rerender } = render(<MeridianDashboard />);

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading your logbook...")).toBeVisible();

    store.saveStatus = "corrupt";
    rerender(<MeridianDashboard />);
    expect(screen.getByRole("alert")).toHaveTextContent("This save cannot be read");
    fireEvent.click(screen.getByRole("button", { name: "Start a new V5 game" }));
    expect(store.startNewGame).toHaveBeenCalledOnce();
  });

  it("reports saving and unavailable persistence states truthfully", () => {
    store.saveStatus = "saving";
    const { rerender } = render(<MeridianDashboard />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving locally");

    store.saveStatus = "unavailable";
    rerender(<MeridianDashboard />);
    expect(screen.getByRole("status")).toHaveTextContent("Local save unavailable; session not saved");
    expect(screen.getByRole("heading", { name: "Market" })).toBeVisible();
  });

  it("replaces docked operations with Voyage status and preserves the latest result", () => {
    store.state.voyage = {
      id: "voyage-1",
      routeId: "lisbon-faro",
      originPortId: "lisbon",
      destinationPortId: "faro",
      departedAt: 0,
      plannedArrivesAt: 2_000,
      staticRisk: 0.1,
      requiredSupplies: { food: 1, water: 1 },
      supplyCost: 2,
      seed: 7,
    };
    store.state.latestVoyageResult = {
      voyageId: "voyage-0",
      arrivedAt: 0,
      destinationPortId: "tangier",
      sourceXpGained: 12,
      supplyCost: 4,
    };
    render(<MeridianDashboard />);

    expect(screen.getByRole("heading", { name: "Voyage in progress" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Market" })).not.toBeInTheDocument();
    expect(screen.getByText("Faro")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Latest arrival" })).toBeVisible();
    expect(screen.getByText(/Arrived at Tangier; source XP gained 12/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Check arrival" }));
    expect(store.resolveVoyage).toHaveBeenCalledOnce();
  });

  it("exposes Route availability and departure through the existing command boundary", () => {
    store.state.fleet.supplies.food.quantity = 2;
    store.state.fleet.supplies.water.quantity = 2;
    render(<MeridianDashboard />);

    const faroRoute = screen.getByText("Faro").closest("li");
    expect(faroRoute).not.toBeNull();
    fireEvent.click(within(faroRoute!).getByRole("button", { name: "Depart" }));
    expect(store.departVoyage).toHaveBeenCalledWith("lisbon-faro");
  });
});
