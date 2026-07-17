import { getPort } from "@/game/domain/content/core-content";
import { SUPPLY_IDS } from "@/game/domain/models/game";
import { supplyPurchaseError, supplyRestockPlan, supplyTargetMaximum, usedCargo } from "@/game/domain/rules/cargo";
import { SUPPLY_LABELS } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";
import { QuantityControl } from "./quantity-control";

type SuppliesPanelProps = {
  store: DashboardStore;
};

export function SuppliesPanel({ store }: SuppliesPanelProps) {
  const { state } = store;
  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);
  const restockPlan = supplyRestockPlan(state);
  const restockReason = restockPlan.error ?? (restockPlan.totalQuantity === 0 ? "Targets already met." : null);

  return (
    <section aria-labelledby="supplies-command">
      <div className={styles.workspaceHeading}>
        <div>
          <p>Fleet stores</p>
          <h3 id="supplies-command">Provision Stores</h3>
        </div>
        <div className={styles.marketPulse}>
          <span>Capacity free</span>
          <strong>{state.fleet.cargoCapacity - cargo} units</strong>
        </div>
      </div>
      <p className={styles.workspaceIntro}>
        Supplies share the Fleet Cargo Capacity. Discarded stores are not refunded.
      </p>
      <label className={styles.autoRestockControl}>
        <input
          type="checkbox"
          checked={state.fleet.autoRestockOnArrival}
          onChange={(event) => store.setAutoRestockOnArrival(event.target.checked)}
        />
        <span>
          <strong>Auto-restock on Voyage arrival</strong>
          <small>Buys target deficits at the destination Port. It never discards Supplies.</small>
        </span>
      </label>
      <div className={styles.restockAll}>
        <div>
          <strong>Fleet replenishment</strong>
          <p className={styles.tradePreview}>
            {restockPlan.totalQuantity > 0
              ? `Buy ${restockPlan.totalQuantity} · Total: ${restockPlan.totalCost} Gold`
              : "Targets already met"}
          </p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={restockReason !== null}
          aria-describedby={restockReason ? "restock-all-reason" : undefined}
          onClick={store.restockAllSupplies}
        >
          Restock all now
        </button>
        {restockReason && (
          <p className={styles.unavailableReason} id="restock-all-reason">
            {restockReason}
          </p>
        )}
      </div>
      <ul className={styles.supplyManagementList}>
        {SUPPLY_IDS.map((supplyId) => {
          const stack = state.fleet.supplies[supplyId];
          const target = state.fleet.supplyTargets[supplyId];
          const delta = target - stack.quantity;
          const purchaseError = delta > 0 ? supplyPurchaseError(state, supplyId, delta) : null;
          const reason = purchaseError ?? (delta === 0 ? "Target already matches the quantity aboard." : null);
          const reasonId = `supply-${supplyId}-reason`;
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
              <QuantityControl
                label={`${SUPPLY_LABELS[supplyId]} target quantity`}
                value={target}
                min={0}
                max={supplyTargetMaximum(state, supplyId)}
                onChange={(nextTarget) => store.setSupplyTarget(supplyId, nextTarget)}
              />
              <div className={styles.supplyApply}>
                <p className={styles.tradePreview}>
                  {delta > 0
                    ? `Buy ${delta} · Total: ${(port?.supplyPrices[supplyId] ?? 0) * delta} Gold`
                    : delta < 0
                      ? `Discard ${-delta}`
                      : "No change"}
                </p>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={delta === 0 || purchaseError !== null}
                  aria-describedby={reason ? reasonId : undefined}
                  onClick={() => store.applySupplyTarget(supplyId)}
                >
                  Apply
                </button>
              </div>
              {reason && (
                <p className={styles.unavailableReason} id={reasonId}>
                  {reason}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
