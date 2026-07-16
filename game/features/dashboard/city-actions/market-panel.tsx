import { getPort, getProduct, getProductFamilyForProduct } from "@/game/domain/content/core-content";
import { buyPrice, productPurchaseError, sellPrice } from "@/game/domain/rules/market";
import { portLevel } from "@/game/domain/rules/progression";
import { displayName } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";

type MarketPanelProps = {
  store: DashboardStore;
};

export function MarketPanel({ store }: MarketPanelProps) {
  const { state } = store;
  const port = getPort(state.fleet.locationPortId);
  const level = portLevel(state, state.fleet.locationPortId);

  return (
    <section aria-labelledby="market-command">
      <div className={styles.workspaceHeading}>
        <div>
          <p>Port exchange</p>
          <h3>Market Exchange</h3>
        </div>
        <div className={styles.marketPulse}>
          <span>Specialty stock</span>
          <strong>{state.marketSession.specialtySupply} units</strong>
        </div>
      </div>
      <p className={styles.workspaceIntro}>
        Compare local reference, purchase, and sale values before committing Cargo Capacity.
      </p>
      <ul className={styles.marketGrid}>
        {port?.catalog.map((entry) => {
          const product = getProduct(entry.productId);
          const family = getProductFamilyForProduct(entry.productId);
          const buy = buyPrice(state, entry.productId);
          const sell = sellPrice(state, entry.productId);
          const held = state.fleet.products[entry.productId]?.quantity ?? 0;
          const locked = level < entry.unlockLevel;
          const purchaseError = productPurchaseError(state, entry.productId, 1);
          const purchaseReasonId = `buy-${entry.productId}-reason`;
          const sellReasonId = `sell-${entry.productId}-reason`;
          return (
            <li key={entry.productId} data-locked={locked || undefined}>
              <div className={styles.productHeading}>
                <div>
                  <span>{family ? displayName(family.category) : "Unknown category"}</span>
                  <strong>{product?.name ?? entry.productId}</strong>
                </div>
                <span>{locked ? `Level ${entry.unlockLevel}` : "Available"}</span>
              </div>
              <dl className={styles.priceLedger}>
                <div>
                  <dt>Reference</dt>
                  <dd>{buy?.reference ?? "-"}</dd>
                </div>
                <div>
                  <dt>Buy</dt>
                  <dd>{buy?.unitPrice ?? "-"}</dd>
                </div>
                <div>
                  <dt>Sell</dt>
                  <dd>{sell?.unitPrice ?? "-"}</dd>
                </div>
                <div>
                  <dt>In hold</dt>
                  <dd>{held}</dd>
                </div>
              </dl>
              <div className={styles.priceContext}>
                <span>{buy?.label ?? "Purchase unavailable"}</span>
                <span>Session net {state.marketSession.netTrade[entry.productId] ?? 0}</span>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={purchaseError !== null}
                  aria-describedby={purchaseError ? purchaseReasonId : undefined}
                  onClick={() => store.buyProduct(entry.productId)}
                >
                  Buy 1
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={held === 0}
                  aria-describedby={held === 0 ? sellReasonId : undefined}
                  onClick={() => store.sellProduct(entry.productId)}
                >
                  Sell 1
                </button>
              </div>
              {purchaseError && (
                <p className={styles.unavailableReason} id={purchaseReasonId}>
                  {purchaseError}
                </p>
              )}
              {held === 0 && (
                <p className={styles.unavailableReason} id={sellReasonId}>
                  No units are held for sale.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
