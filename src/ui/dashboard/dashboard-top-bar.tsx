import { getPort } from "@/content/core-content";
import { usedCargo } from "@/core/rules/cargo";
import { portLevel } from "@/core/rules/progression";
import type { DashboardStore } from "./dashboard-types";
import styles from "./meridian-dashboard.module.css";

type DashboardTopBarProps = {
  store: DashboardStore;
};

export function DashboardTopBar({ store }: DashboardTopBarProps) {
  const { saveStatus, state } = store;
  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);
  const level = portLevel(state, state.fleet.locationPortId);
  const saveLabel =
    saveStatus === "saving"
      ? "Saving locally"
      : saveStatus === "unavailable"
        ? "Local save unavailable; session not saved"
        : "Saved locally";

  return (
    <header className={styles.topBar}>
      <div className={styles.brandBlock}>
        <span className={styles.brandMark} aria-hidden="true">
          MI
        </span>
        <div>
          <span className={styles.kicker}>Captain&apos;s ledger</span>
          <h1>Meridian Idle</h1>
        </div>
      </div>

      <dl className={styles.globalResources} aria-label="Global resources">
        <div>
          <dt>Gold</dt>
          <dd>{state.fleet.gold.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt>Cargo</dt>
          <dd>
            {cargo} / {state.fleet.cargoCapacity}
          </dd>
        </div>
        <div>
          <dt>Port Level</dt>
          <dd>
            {port?.name ?? "Unknown"} {level}
          </dd>
        </div>
      </dl>

      <p className={styles.saveStatus} data-status={saveStatus} role="status">
        <span aria-hidden="true" />
        {saveLabel}
      </p>
    </header>
  );
}
