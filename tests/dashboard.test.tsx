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

  it("renders the production HUD and wires Market and migration commands", () => {
    render(<MeridianDashboard />);

    expect(screen.getByRole("heading", { name: "Port operations at Lisbon" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Market Exchange" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Product Cargo" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Provisioning" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Activity Log" })).toBeVisible();
    expect(screen.getByText("Captain records are not available in V5 Core.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();

    const marketPanel = screen.getByRole("heading", { name: "Market Exchange" }).closest("section");
    const codCard = within(marketPanel!).getByText("Cod").closest("li");
    expect(codCard).not.toBeNull();
    fireEvent.click(within(codCard!).getByRole("button", { name: "Buy 1" }));
    expect(store.buyProduct).toHaveBeenCalledWith("cod");
  });

  it("switches city actions and wires Product, Supply, and Harbor commands", () => {
    store.state.fleet.products = { cod: { quantity: 1, totalCostBasis: 20 } };
    store.state.fleet.supplies.food = { quantity: 2, totalCostBasis: 16 };
    store.state.fleet.supplies.water = { quantity: 2, totalCostBasis: 8 };
    render(<MeridianDashboard />);

    const marketPanel = screen.getByRole("heading", { name: "Market Exchange" }).closest("section");
    const codCard = within(marketPanel!).getByText("Cod").closest("li");
    fireEvent.click(within(codCard!).getByRole("button", { name: "Sell 1" }));
    expect(store.sellProduct).toHaveBeenCalledWith("cod");

    fireEvent.click(screen.getByRole("button", { name: /Supplies Management/ }));
    const supplyPanel = screen.getByRole("heading", { name: "Provision Stores" }).closest("section");
    expect(supplyPanel).not.toBeNull();
    const foodRow = within(supplyPanel!).getByText("Food").closest("li");
    fireEvent.click(within(foodRow!).getByRole("button", { name: "Buy 1" }));
    fireEvent.click(within(foodRow!).getByRole("button", { name: "Discard 1" }));
    expect(store.buySupply).toHaveBeenCalledWith("food", 1);
    expect(store.discardSupply).toHaveBeenCalledWith("food", 1);

    fireEvent.click(screen.getByRole("button", { name: /Harbor/ }));
    expect(screen.getByRole("heading", { name: "Choose Next Port" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Depart for Faro" }));
    expect(store.departVoyage).toHaveBeenCalledWith("lisbon-faro");
  });

  it("associates visible Product and Supply purchase reasons with disabled controls", () => {
    store.state.fleet.gold = 0;
    render(<MeridianDashboard />);

    const codCard = screen.getByText("Cod").closest("li");
    const productBuy = within(codCard!).getByRole("button", { name: "Buy 1" });
    expect(productBuy).toBeDisabled();
    expect(productBuy).toHaveAccessibleDescription(/Requires 20 Gold; only 0 is available/);

    fireEvent.click(screen.getByRole("button", { name: /Supplies Management/ }));
    const supplyPanel = screen.getByRole("heading", { name: "Provision Stores" }).closest("section");
    const foodRow = within(supplyPanel!).getByText("Food").closest("li");
    const supplyBuy = within(foodRow!).getByRole("button", { name: "Buy 1" });
    expect(supplyBuy).toBeDisabled();
    expect(supplyBuy).toHaveAccessibleDescription(/Requires 8 Gold; only 0 is available/);
  });

  it("announces command errors without replacing the selected city operation", () => {
    store.commandError = "Secure randomness is unavailable.";
    render(<MeridianDashboard />);

    expect(screen.getByRole("alert")).toHaveTextContent("Command failed: Secure randomness is unavailable.");
    expect(screen.getByRole("heading", { name: "Market Exchange" })).toBeVisible();
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
    expect(screen.getByRole("heading", { name: "Market Exchange" })).toBeVisible();
  });

  it("shows derived Voyage progress without a manual arrival control", () => {
    const now = Date.now();
    store.state.voyage = {
      id: "voyage-1",
      routeId: "lisbon-faro",
      originPortId: "lisbon",
      destinationPortId: "faro",
      departedAt: now - 1_000,
      plannedArrivesAt: now + 1_000,
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

    expect(screen.getByRole("heading", { name: "Lisbon to Faro" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Voyage progress" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "City actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check arrival" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest arrival" })).toBeVisible();
    expect(screen.getByText(/Source XP gained 12; committed supply cost 4/)).toBeVisible();
  });

  it("disables Harbor departure when secure randomness is unavailable", () => {
    store.state.fleet.supplies.food.quantity = 2;
    store.state.fleet.supplies.water.quantity = 2;
    store.canGenerateVoyageSeed = false;
    render(<MeridianDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Harbor/ }));
    const departure = screen.getByRole("button", { name: "Depart for Faro" });
    expect(departure).toBeDisabled();
    expect(departure).toHaveAccessibleDescription("Secure randomness is unavailable.");
  });
});
