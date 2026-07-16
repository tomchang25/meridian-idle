import { getPort } from "@/game/domain/content/core-content";
import { SUPPLY_IDS } from "@/game/domain/models/game";
import { supplyPurchaseError, usedCargo } from "@/game/domain/rules/cargo";
import { SUPPLY_LABELS } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";

type SuppliesPanelProps = {
  store: DashboardStore;
};

export function SuppliesPanel({ store }: SuppliesPanelProps) {
  const { state } = store;
  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);

  return (
    <section aria-labelledby="supplies-command">
      <div className={styles.workspaceHeading}>
        <div>
          <p>Fleet stores</p>
          <h3>Provision Stores</h3>
        </div>
        <div className={styles.marketPulse}>
          <span>Capacity free</span>
          <strong>{state.fleet.cargoCapacity - cargo} units</strong>
        </div>
      </div>
      <p className={styles.workspaceIntro}>
        Supplies share the Fleet Cargo Capacity. Discarded stores are not refunded.
      </p>
      <ul className={styles.supplyManagementList}>
        {SUPPLY_IDS.map((supplyId) => {
          const stack = state.fleet.supplies[supplyId];
          const purchaseError = supplyPurchaseError(state, supplyId, 1);
          const purchaseReasonId = `buy-${supplyId}-reason`;
          const discardReasonId = `discard-${supplyId}-reason`;
          return (
            <li key={supplyId}>
              <span className={styles.supplyIcon} aria-hidden="true">
                {SUPPLY_LABELS[supplyId].slice(0, 1)}
              </span>
              <div className={styles.supplyIdentity}>
                <strong>{SUPPLY_LABELS[supplyId]}</strong>
                <span>
                  {stack.quantity} aboard / {stack.totalCostBasis} Gold basis
                </span>
              </div>
              <div className={styles.supplyPrice}>
                <span>Local price</span>
                <strong>{port?.supplyPrices[supplyId] ?? "-"} Gold</strong>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={purchaseError !== null}
                  aria-describedby={purchaseError ? purchaseReasonId : undefined}
                  onClick={() => store.buySupply(supplyId, 1)}
                >
                  Buy 1
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={stack.quantity === 0}
                  aria-describedby={stack.quantity === 0 ? discardReasonId : undefined}
                  onClick={() => store.discardSupply(supplyId, 1)}
                >
                  Discard 1
                </button>
              </div>
              {purchaseError && (
                <p className={styles.unavailableReason} id={purchaseReasonId}>
                  {purchaseError}
                </p>
              )}
              {stack.quantity === 0 && (
                <p className={styles.unavailableReason} id={discardReasonId}>
                  No units are aboard to discard.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
