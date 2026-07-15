import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ACTIONS } from "@/game/domain/content/actions";
import { createInitialGameState } from "@/game/domain/state/initial-game-state";
import { ActionCard } from "@/game/features/dashboard/meridian-dashboard";

describe("ActionCard", () => {
  it("starts an available action", () => {
    const onStart = vi.fn();
    const action = ACTIONS.find((candidate) => candidate.id === "olive-oil-trade");
    expect(action).toBeDefined();

    render(<ActionCard action={action!} state={createInitialGameState()} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "開始行動" }));

    expect(onStart).toHaveBeenCalledWith("olive-oil-trade");
  });

  it("explains and disables a locked action", () => {
    const action = ACTIONS.find((candidate) => candidate.id === "greek-ruins");
    expect(action).toBeDefined();

    render(<ActionCard action={action!} state={createInitialGameState()} onStart={() => undefined} />);

    expect(screen.getByText(/需要：考古學 20、希臘語支援 1/)).toBeVisible();
    expect(screen.getByRole("button", { name: "尚未解鎖" })).toBeDisabled();
  });
});
