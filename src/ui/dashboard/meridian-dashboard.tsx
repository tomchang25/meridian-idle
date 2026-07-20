"use client";

import { useGameStore } from "@/runtime/use-game-store";
import { ActivityLog } from "./activity-log";
import { CityActionPanel } from "./city-actions/city-action-panel";
import { DashboardFeedback } from "./dashboard-feedback";
import { DashboardTopBar } from "./dashboard-top-bar";
import { PortScenePanel } from "./scene/port-scene-panel";
import { LongTermSidebar, ShortTermSidebar } from "./sidebars/dashboard-sidebars";
import styles from "./meridian-dashboard.module.css";
import { VoyageStatusPanel } from "./voyage/voyage-status-panel";

export function MeridianDashboard() {
  const store = useGameStore();
  const { saveStatus, state } = store;

  if (saveStatus === "loading")
    return (
      <main className={styles.stateScreen} aria-busy="true">
        <section className={styles.stateCard} aria-labelledby="loading-title">
          <p className={styles.kicker}>Captain&apos;s log</p>
          <h1 id="loading-title">Meridian Idle</h1>
          <p>Loading your logbook...</p>
        </section>
      </main>
    );

  if (saveStatus === "corrupt")
    return (
      <main className={styles.stateScreen}>
        <section className={styles.stateCard} aria-labelledby="recovery-title">
          <p className={styles.kicker}>Logbook recovery</p>
          <h1 id="recovery-title">Meridian Idle</h1>
          <p role="alert">This save cannot be read. It has not been overwritten.</p>
          <button className={styles.primaryButton} type="button" onClick={store.startNewGame}>
            Start a new V5 game
          </button>
        </section>
      </main>
    );

  return (
    <main className={styles.shell} data-voyage-state={state.voyage ? "transit" : "docked"}>
      <DashboardTopBar store={store} />
      <div className={styles.hudGrid}>
        <LongTermSidebar state={state} />
        <div className={styles.mainColumn}>
          <PortScenePanel state={state} />
          <DashboardFeedback store={store} />
          {state.voyage ? <VoyageStatusPanel voyage={state.voyage} /> : <CityActionPanel store={store} />}
          <ActivityLog state={state} />
        </div>
        <ShortTermSidebar state={state} />
      </div>
    </main>
  );
}
