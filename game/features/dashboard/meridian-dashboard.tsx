"use client";

import { useGameStore } from "@/game/application/use-game-store";
import { SUPPLY_IDS } from "@/game/domain/models/game";
import { getPort, getProduct } from "@/game/domain/content/core-content";

export function MeridianDashboard() {
  const { state, saveStatus, acknowledgeMigration, startNewGame, buySupply, discardSupply } = useGameStore();
  if (saveStatus === "loading") return <main aria-busy="true">Loading your logbook…</main>;
  if (saveStatus === "corrupt")
    return (
      <main>
        <h1>Meridian Idle</h1>
        <p role="alert">This save cannot be read. It has not been overwritten.</p>
        <button type="button" onClick={startNewGame}>
          Start a new V5 game
        </button>
      </main>
    );
  return (
    <main>
      <header>
        <p>Meridian Idle</p>
        <p>Save status: {saveStatus === "unavailable" ? "Local save unavailable" : "Saved"}</p>
      </header>
      <section aria-labelledby="port">
        <p>Current port</p>
        <h1 id="port">Lisbon</h1>
        <p>Gold {state.fleet.gold.toLocaleString("en-US")}</p>
        <p>
          Fleet HP {state.fleet.hp}/{state.fleet.maxHp} · Attack {state.fleet.attack} · Cargo 0/
          {state.fleet.cargoCapacity}
        </p>
      </section>
      {state.migrationReport && !state.migrationReport.acknowledged && (
        <section aria-labelledby="migration">
          <h2 id="migration">V3 migration report</h2>
          <p>Your Gold was preserved. Dropped V3 data:</p>
          <ul>
            {state.migrationReport.droppedFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          <button type="button" onClick={acknowledgeMigration}>
            Acknowledge migration report
          </button>
        </section>
      )}
      <section aria-labelledby="provisioning">
        <h2 id="provisioning">Provisioning</h2>
        <p>
          Cargo {Object.values(state.fleet.supplies).reduce((sum, stack) => sum + stack.quantity, 0)}/
          {state.fleet.cargoCapacity}
        </p>
        <ul>
          {SUPPLY_IDS.map((supplyId) => (
            <li key={supplyId}>
              {supplyId}: {state.fleet.supplies[supplyId].quantity} · cost{" "}
              {getPort(state.fleet.locationPortId)?.supplyPrices[supplyId]}{" "}
              <button type="button" onClick={() => buySupply(supplyId, 1)}>
                Buy 1
              </button>
              <button
                type="button"
                disabled={state.fleet.supplies[supplyId].quantity === 0}
                onClick={() => discardSupply(supplyId, 1)}
              >
                Discard 1
              </button>
            </li>
          ))}
        </ul>
        <h3>Port catalog</h3>
        <ul>
          {getPort(state.fleet.locationPortId)?.catalog.map((entry) => (
            <li key={entry.productId}>
              {getProduct(entry.productId)?.name} · unlocks at Level {entry.unlockLevel}
            </li>
          ))}
        </ul>
        <p>Product trading and voyages become available in later phases.</p>
      </section>
    </main>
  );
}
