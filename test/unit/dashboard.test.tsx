import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveStatus } from "@/runtime/use-game-store";
import type { GameState, PlannedPassageSnapshot } from "@/core/model/game";
import type { BreakOffExitOption, BreakOffPreview } from "@/core/rules/voyage";
import { createInitialGameState } from "@/core/state/initial-game-state";
import { MeridianDashboard } from "@/ui/dashboard/meridian-dashboard";

const store = {
  state: {
    ...createInitialGameState(0),
    migrationReport: { fromVersion: 1 as const, migratedAt: 0, acknowledged: false, droppedFields: ["Captain"] },
  } as GameState,
  saveStatus: "saved" as SaveStatus,
  commandError: null as string | null,
  canGenerateVoyageSeed: true,
  acknowledgeMigration: vi.fn(),
  startNewGame: vi.fn(),
  setSupplyTarget: vi.fn(),
  setAutoRestockOnArrival: vi.fn(),
  applySupplyTarget: vi.fn(),
  restockAllSupplies: vi.fn(),
  buyProduct: vi.fn(),
  sellProduct: vi.fn(),
  previewVoyage: vi.fn((destinationPortId: string) => ({
    destinationPortId,
    quoteId: `quote-${destinationPortId}`,
    scheduledDurationMilliseconds: destinationPortId === "faro" ? 40_000 : 96_000,
    passage: {
      kind: "planned" as const,
      originPortId: "lisbon",
      destinationPortId,
      edges:
        destinationPortId === "faro"
          ? [
              {
                id: "lisbon-cape-outbound",
                originNodeId: "lisbon-approach",
                destinationNodeId: "cape-st-vincent",
                simulationEndOffsetMilliseconds: 20_000,
                staticRisk: 0.05,
                spans: [
                  { subRegionId: "tagus-approaches", simulationEndOffsetMilliseconds: 10_000 },
                  { subRegionId: "algarve-coast", simulationEndOffsetMilliseconds: 20_000 },
                ],
              },
              {
                id: "cape-faro-outbound",
                originNodeId: "cape-st-vincent",
                destinationNodeId: "faro-approach",
                simulationEndOffsetMilliseconds: 40_000,
                staticRisk: 0.05,
                spans: [{ subRegionId: "algarve-coast", simulationEndOffsetMilliseconds: 40_000 }],
              },
            ]
          : [],
      totalDistance: destinationPortId === "faro" ? 20 : 48,
      plannedSailingDurationMilliseconds: destinationPortId === "faro" ? 40_000 : 96_000,
      pacingMultiplier: 1,
      requiredSupplies: { food: destinationPortId === "faro" ? 1 : 2, water: destinationPortId === "faro" ? 1 : 2 },
      staticRisk: destinationPortId === "faro" ? 0.1 : 0.2,
    },
    readiness: { food: { required: 1, aboard: 2, missing: 0 }, water: { required: 1, aboard: 2, missing: 0 } },
    error: null,
  })),
  departVoyage: vi.fn(),
  previewBreakOff: vi.fn((): BreakOffPreview => ({ kind: "unavailable", error: "The Fleet is not underway." })),
  breakOffVoyage: vi.fn(),
  breakOffAtNode: vi.fn(),
  clock: { now: () => 0 },
};

vi.mock("@/runtime/use-game-store", () => ({ useGameStore: () => store }));

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
    store.previewBreakOff.mockReturnValue({ kind: "unavailable", error: "The Fleet is not underway." });
  });

  afterEach(cleanup);

  it("renders the production HUD and wires Market and migration commands", () => {
    render(<MeridianDashboard />);

    expect(screen.getByRole("heading", { name: "Port operations at Lisbon" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Market Exchange" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cargo Hold" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Products" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Supplies" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Activity Log" })).toBeVisible();
    expect(screen.getByText("Captain records are not available in V5 Core.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge migration report" }));
    expect(store.acknowledgeMigration).toHaveBeenCalledOnce();

    const marketPanel = screen.getByRole("heading", { name: "Market Exchange" }).closest("section");
    expect(within(marketPanel!).queryByText("Reference")).not.toBeInTheDocument();
    const codCard = within(marketPanel!).getByText("Cod").closest("li");
    expect(codCard).not.toBeNull();
    fireEvent.change(within(codCard!).getByRole("spinbutton", { name: "Cod buy quantity" }), {
      target: { value: "3" },
    });
    fireEvent.click(within(codCard!).getByRole("button", { name: "Buy 3" }));
    expect(store.buyProduct).toHaveBeenCalledWith("cod", 3);
  });

  it("keeps the main column between the left and right sidebars", () => {
    render(<MeridianDashboard />);

    const leftSidebar = screen.getByRole("complementary", { name: "Long-term status" });
    const rightSidebar = screen.getByRole("complementary", { name: "Short-term status" });
    const mainColumn = screen
      .getByRole("heading", { name: "Port operations at Lisbon" })
      .closest("section")?.parentElement;

    expect(Array.from(leftSidebar.parentElement!.children)).toEqual([leftSidebar, mainColumn, rightSidebar]);
  });

  it("shows combined Cargo Hold allocation and Product unit prices", () => {
    store.state.fleet.products = { cod: { quantity: 9, totalCostBasis: 293 } };
    store.state.fleet.supplies.food = { quantity: 3, totalCostBasis: 24 };
    render(<MeridianDashboard />);

    const cargoPanel = screen.getByRole("heading", { name: "Cargo Hold" }).closest("section");
    expect(
      within(cargoPanel!).getByRole("img", { name: "Cargo hold: 3 Supply units, 9 Product units, 48 units free." }),
    ).toBeVisible();
    expect(within(cargoPanel!).getByRole("img", { name: "Supply distribution: Food 3." })).toBeVisible();
    expect(within(cargoPanel!).getByRole("img", { name: "Product distribution: Cod 9." })).toBeVisible();
    expect(within(cargoPanel!).getByText("Avg cost")).toBeVisible();
    expect(within(cargoPanel!).getByText("32.56 Gold / unit")).toBeVisible();
    expect(within(cargoPanel!).getByText("Local sale")).toBeVisible();
    expect(within(cargoPanel!).getAllByText(/Gold \/ unit/)).toHaveLength(2);
  });

  it("shows a held Product's average cost while buying", () => {
    store.state.fleet.products = { cod: { quantity: 9, totalCostBasis: 293 } };
    render(<MeridianDashboard />);

    const marketPanel = screen.getByRole("heading", { name: "Market Exchange" }).closest("section");
    const codCard = within(marketPanel!).getByText("Cod").closest("li");
    expect(within(codCard!).getByText("Avg cost")).toBeVisible();
    expect(within(codCard!).getByText("32.56 Gold / unit")).toBeVisible();
  });

  it("switches city actions and wires cargo-complete Product, Supply, and Harbor commands", () => {
    store.state.fleet.products = {
      cod: { quantity: 1, totalCostBasis: 100 },
      tuna: { quantity: 2, totalCostBasis: 2 },
    };
    store.state.fleet.supplies.food = { quantity: 2, totalCostBasis: 16 };
    store.state.fleet.supplies.water = { quantity: 2, totalCostBasis: 8 };
    store.state.fleet.supplyTargets.food = 4;
    render(<MeridianDashboard />);

    const marketPanel = screen.getByRole("heading", { name: "Market Exchange" }).closest("section");
    fireEvent.click(within(marketPanel!).getByRole("button", { name: "Sell Cargo" }));
    const codCard = within(marketPanel!).getByText("Cod").closest("li");
    const tunaCard = within(marketPanel!).getByText("Tuna").closest("li");
    expect(within(tunaCard!).getByText("Avg cost")).toBeVisible();
    expect(within(tunaCard!).getByText("1.00 Gold / unit")).toBeVisible();
    expect(within(tunaCard!).getByText(/^\+\d+ Gold$/)).toHaveAttribute("data-profit", "positive");
    expect(within(codCard!).getByText(/^-\d+ Gold$/)).toHaveAttribute("data-profit", "negative");
    fireEvent.click(within(tunaCard!).getByRole("button", { name: "Sell 1" }));
    expect(store.sellProduct).toHaveBeenCalledWith("tuna", 1);
    expect(within(marketPanel!).getByText("Local product. Low local sale value.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Supplies Management/ }));
    const supplyPanel = screen.getByRole("heading", { name: "Provision Stores" }).closest("section");
    expect(supplyPanel).not.toBeNull();
    expect(within(supplyPanel!).getByText("Munitions")).toBeVisible();
    expect(within(supplyPanel!).getByText("Spares")).toBeVisible();
    const foodRow = within(supplyPanel!).getByText("Food").closest("li");
    expect(within(foodRow!).getByText("Unit price")).toBeVisible();
    expect(within(foodRow!).getByText("8 Gold")).toBeVisible();
    fireEvent.change(within(foodRow!).getByRole("spinbutton", { name: "Food target quantity" }), {
      target: { value: "3" },
    });
    expect(store.setSupplyTarget).toHaveBeenCalledWith("food", 3);
    fireEvent.click(within(foodRow!).getByRole("button", { name: "Apply" }));
    expect(store.applySupplyTarget).toHaveBeenCalledWith("food");

    fireEvent.click(within(supplyPanel!).getByRole("checkbox", { name: /Auto-restock on Voyage arrival/ }));
    expect(store.setAutoRestockOnArrival).toHaveBeenCalledWith(true);
    fireEvent.click(within(supplyPanel!).getByRole("button", { name: "Restock all now" }));
    expect(store.restockAllSupplies).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /Harbor/ }));
    expect(screen.getByRole("heading", { name: "Choose a destination" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Lisbon, current berth, selected/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Tangier, select destination/ })).toBeVisible();
    expect(screen.queryByText("Known waters")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Manage Supplies/ })).not.toBeInTheDocument();
    const marketSession = store.state.marketSession;
    fireEvent.click(screen.getByRole("button", { name: /Faro, select destination/ }));
    expect(store.state.marketSession).toBe(marketSession);
    expect(store.departVoyage).not.toHaveBeenCalled();
    expect(screen.getByText("Faro Pig · Level 50")).toBeVisible();
    expect(screen.getByText("Market prices are available after docking.")).toBeVisible();
    expect(screen.getByText("Tagus Approaches → Algarve Coast")).toBeVisible();
    expect(screen.getAllByText(/1 required \/ 2 aboard \/ Ready/)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Set Sail for Faro" }));
    expect(store.departVoyage).toHaveBeenCalledWith("faro", "quote-faro");
  });

  it("associates visible Product and Supply purchase reasons with disabled controls", () => {
    store.state.fleet.gold = 0;
    store.state.fleet.supplyTargets.food = 1;
    render(<MeridianDashboard />);

    const codCard = screen.getByText("Cod").closest("li");
    const productBuy = within(codCard!).getByRole("button", { name: "Buy 0" });
    expect(productBuy).toBeDisabled();
    expect(productBuy).toHaveAccessibleDescription(/Requires 23 Gold; only 0 is available/);

    fireEvent.click(screen.getByRole("button", { name: /Supplies Management/ }));
    const supplyPanel = screen.getByRole("heading", { name: "Provision Stores" }).closest("section");
    const foodRow = within(supplyPanel!).getByText("Food").closest("li");
    fireEvent.change(within(foodRow!).getByRole("spinbutton", { name: "Food target quantity" }), {
      target: { value: "1" },
    });
    const supplyApply = within(foodRow!).getByRole("button", { name: "Apply" });
    expect(supplyApply).toBeDisabled();
    expect(supplyApply).toHaveAccessibleDescription(/Requires 8 Gold; only 0 is available/);
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
      departedAt: now - 1_000,
      plannedArrivesAt: now + 1_000,
      passage: {
        kind: "planned",
        originPortId: "lisbon",
        destinationPortId: "faro",
        edges: [],
        totalDistance: 20,
        plannedSailingDurationMilliseconds: 40_000,
        pacingMultiplier: 20,
        staticRisk: 0.1,
        requiredSupplies: { food: 1, water: 1 },
        departedMidEdge: false,
      },
      progress: {
        kind: "planned",
        resolvedAt: now - 1_000,
        resolvedSimulationOffsetMilliseconds: 20_000,
        completedSpanCount: 0,
        completedEdgeCount: 0,
        position: {
          kind: "edge",
          edgeId: "fixture-edge",
          originNodeId: "lisbon",
          destinationNodeId: "faro",
          simulationOffsetMilliseconds: 20_000,
        },
        nextBoundaryAt: now + 1_000,
        supplyLedger: {
          accountingMode: "accruing",
          consumedSupplies: { food: 0, water: 0 },
          remainderMicroUnitMilliseconds: { food: 0, water: 0 },
          supplyConsumptionMicroUnitsPerSecond: { food: 20_000, water: 20_000 },
        },
      },
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
    expect(screen.getByText(/Food 0 \/ 1/)).toBeVisible();
    expect(screen.getByText("Open waters")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "City actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check arrival" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest arrival" })).toBeVisible();
    expect(screen.getByText(/Source XP gained 12; committed supply cost 4/)).toBeVisible();
  });

  it("offers both break-off exits while underway and wires the chosen exit to breakOffVoyage", () => {
    const now = Date.now();
    store.state.voyage = {
      id: "voyage-1",
      departedAt: now - 1_000,
      plannedArrivesAt: now + 1_000,
      passage: {
        kind: "planned",
        originPortId: "lisbon",
        destinationPortId: "faro",
        edges: [],
        totalDistance: 20,
        plannedSailingDurationMilliseconds: 40_000,
        pacingMultiplier: 20,
        staticRisk: 0.1,
        requiredSupplies: { food: 1, water: 1 },
        departedMidEdge: false,
      },
      progress: {
        kind: "planned",
        resolvedAt: now - 1_000,
        resolvedSimulationOffsetMilliseconds: 20_000,
        completedSpanCount: 0,
        completedEdgeCount: 0,
        position: {
          kind: "edge",
          edgeId: "fixture-edge",
          originNodeId: "lisbon-approach",
          destinationNodeId: "cape-st-vincent",
          simulationOffsetMilliseconds: 20_000,
        },
        nextBoundaryAt: now + 1_000,
        supplyLedger: {
          accountingMode: "accruing",
          consumedSupplies: { food: 0, water: 0 },
          remainderMicroUnitMilliseconds: { food: 0, water: 0 },
          supplyConsumptionMicroUnitsPerSecond: { food: 20_000, water: 20_000 },
        },
      },
      supplyCost: 2,
      seed: 7,
    };
    const priorOption: BreakOffExitOption = {
      exit: "prior",
      nodeId: "lisbon-approach",
      quoteId: "quote-prior",
      passage: { kind: "planned", staticRisk: 0.02 } as unknown as PlannedPassageSnapshot,
      scheduledDurationMilliseconds: 300,
      supplyConsumptionMicroUnitsPerSecond: { food: 20_000, water: 20_000 },
      readiness: { food: { required: 1, aboard: 2, missing: 0 }, water: { required: 1, aboard: 2, missing: 0 } },
      error: null,
    };
    const nextOption: BreakOffExitOption = {
      ...priorOption,
      exit: "next",
      nodeId: "cape-st-vincent",
      quoteId: "quote-next",
    };
    store.previewBreakOff.mockReturnValue({ kind: "mid-edge", prior: priorOption, next: nextOption });

    render(<MeridianDashboard />);

    expect(screen.getByText("Lisbon Approach")).toBeVisible();
    expect(screen.getByText("Cape St. Vincent")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Break off back" }));
    expect(store.breakOffVoyage).toHaveBeenCalledWith("prior", "quote-prior");
    fireEvent.click(screen.getByRole("button", { name: "Break off onward" }));
    expect(store.breakOffVoyage).toHaveBeenCalledWith("next", "quote-next");
  });

  it("opens a chart-backed sailing target picker from a safe holding position and can return", () => {
    store.state.fleet.holdingNavPointId = "cape-st-vincent";
    store.state.fleet.holdingOriginNodeId = "lisbon";
    render(<MeridianDashboard />);

    expect(screen.getByRole("heading", { name: "Cape St. Vincent" })).toBeVisible();
    expect(screen.getByText("Awaiting your next order")).toBeVisible();
    expect(screen.getByText("Paused")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Nautical Chart" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Choose sailing target" }));
    expect(screen.getByRole("heading", { name: "Nautical Chart" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Faro, select destination/ }));
    expect(screen.getByRole("heading", { name: "Faro" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Set Sail for Faro" }));
    expect(store.departVoyage).toHaveBeenCalledWith("faro", "quote-faro");

    fireEvent.click(screen.getByRole("button", { name: "← Back to holding position" }));
    expect(screen.getByText("Awaiting your next order")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Nautical Chart" })).not.toBeInTheDocument();
  });

  it("disables Harbor departure when secure randomness is unavailable", () => {
    store.state.fleet.supplies.food.quantity = 2;
    store.state.fleet.supplies.water.quantity = 2;
    store.canGenerateVoyageSeed = false;
    render(<MeridianDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /Harbor/ }));
    fireEvent.click(screen.getByRole("button", { name: /Faro, select destination/ }));
    const departure = screen.getByRole("button", { name: "Set Sail for Faro" });
    expect(departure).toBeDisabled();
    expect(departure).toHaveAccessibleDescription("Secure randomness is unavailable.");
  });
});
