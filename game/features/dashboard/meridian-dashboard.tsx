"use client";

import { useGameStore } from "@/game/application/use-game-store";

export function MeridianDashboard() {
  const { state, saveStatus, acknowledgeMigration, startNewGame } = useGameStore();
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
      <section>
        <h2>Port operations</h2>
        <p>Trading, provisioning, and voyages become available in later phases.</p>
      </section>
    </main>
  );
}
