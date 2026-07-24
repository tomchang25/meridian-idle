import { useState } from "react";
import { getPort } from "@/content/content-catalog";
import { CITY_ACTIONS, type CityAction } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";
import { HarborPanel } from "./harbor-panel";
import { MarketPanel } from "./market-panel";
import { SuppliesPanel } from "./supplies-panel";

type CityActionPanelProps = {
  store: DashboardStore;
};

export function CityActionPanel({ store }: CityActionPanelProps) {
  const [cityAction, setCityAction] = useState<CityAction>("market");
  const port = getPort(store.state.fleet.locationPortId);

  return (
    <section className={styles.actionPanel} aria-labelledby="action-panel-title">
      <div className={styles.actionPanelHeading}>
        <div>
          <p>{port?.name ?? "Unknown Port"} command office</p>
          <h2 id="action-panel-title">City Actions</h2>
        </div>
        <span>Session {store.state.marketSession.id}</span>
      </div>

      <nav className={styles.cityCommands} aria-label="City actions">
        {CITY_ACTIONS.map((action) => (
          <button
            id={`${action.id}-command`}
            type="button"
            aria-pressed={cityAction === action.id}
            onClick={() => setCityAction(action.id)}
            key={action.id}
          >
            <span className={styles.commandIcon} aria-hidden="true">
              {action.shortLabel}
            </span>
            <span>
              <small>City command</small>
              <strong>{action.label}</strong>
            </span>
          </button>
        ))}
      </nav>

      <div className={styles.actionWorkspace}>
        {cityAction === "market" && <MarketPanel store={store} />}
        {cityAction === "supplies" && <SuppliesPanel store={store} />}
        {cityAction === "harbor" && <HarborPanel store={store} />}
      </div>
    </section>
  );
}
