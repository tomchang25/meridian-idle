import { useState } from "react";
import { getPort, getProduct, getProductFamilyForProduct } from "@/content/core-content";
import { averageUnitCost, removedCostBasis } from "@/core/rules/cargo";
import { buyPrice, maximumProductPurchaseQuantity, productPurchaseError, sellPrice } from "@/core/rules/market";
import { portLevel } from "@/core/rules/progression";
import { displayName, formatUnitGold } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";
import { QuantityControl } from "./quantity-control";

type MarketPanelProps = {
  store: DashboardStore;
};

export function MarketPanel({ store }: MarketPanelProps) {
  const { state } = store;
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const port = getPort(state.fleet.locationPortId);
  const level = portLevel(state, state.fleet.locationPortId);
  const productIds =
    mode === "buy"
      ? (port?.catalog.map((entry) => entry.productId) ?? [])
      : Object.entries(state.fleet.products)
          .filter(([, stack]) => stack.quantity > 0)
          .map(([productId]) => productId);

  const selectMode = (nextMode: "buy" | "sell") => {
    setMode(nextMode);
    setDrafts({});
  };

  return (
    <section aria-labelledby="market-command">
      <div className={styles.workspaceHeading}>
        <div>
          <p>Port exchange</p>
          <h3 id="market-command">Market Exchange</h3>
        </div>
        <div className={styles.marketPulse}>
          <span>Specialty stock</span>
          <strong>{state.marketSession.specialtySupply} units</strong>
        </div>
      </div>
      <p className={styles.workspaceIntro}>
        {mode === "buy"
          ? "Purchase from this Port's complete catalog before committing Cargo Capacity."
          : "Sell every Product currently held in Fleet Cargo at this Port's market value."}
      </p>
      <div className={styles.marketModes} role="group" aria-label="Market trade mode">
        <button type="button" aria-pressed={mode === "buy"} onClick={() => selectMode("buy")}>
          Buy Goods
        </button>
        <button type="button" aria-pressed={mode === "sell"} onClick={() => selectMode("sell")}>
          Sell Cargo
        </button>
      </div>
      {mode === "sell" && productIds.length === 0 && (
        <p className={styles.emptyState}>No Products are held in Fleet Cargo to sell.</p>
      )}
      <ul className={styles.marketGrid}>
        {productIds.map((productId) => {
          const entry = port?.catalog.find((candidate) => candidate.productId === productId);
          const product = getProduct(productId);
          const family = getProductFamilyForProduct(productId);
          const price = mode === "buy" ? buyPrice(state, productId) : sellPrice(state, productId);
          const stack = state.fleet.products[productId];
          const averageCost = averageUnitCost(stack);
          const held = stack?.quantity ?? 0;
          const maximum = mode === "buy" ? maximumProductPurchaseQuantity(state, productId) : held;
          const quantity = Math.min(drafts[productId] ?? (maximum > 0 ? 1 : 0), maximum);
          const profit =
            mode === "sell" && price && stack ? price.unitPrice * quantity - removedCostBasis(stack, quantity) : null;
          const locked = mode === "buy" && !!entry && level < entry.unlockLevel;
          const purchaseError = mode === "buy" ? productPurchaseError(state, productId, 1) : null;
          const reason = purchaseError ?? (maximum === 0 ? "No units are available for this transaction." : null);
          const reasonId = `${mode}-${productId}-reason`;
          const locallyProduced = mode === "sell" && !!entry;
          return (
            <li key={productId} data-locked={locked || undefined} data-warning={locallyProduced || undefined}>
              <div className={styles.productHeading}>
                <div>
                  <span>{family ? displayName(family.category) : "Unknown category"}</span>
                  <strong>{product?.name ?? productId}</strong>
                </div>
                <span>
                  {locked ? `Locked: Level ${entry?.unlockLevel}` : mode === "buy" ? "Available" : `${held} held`}
                </span>
              </div>
              <dl className={styles.priceLedger}>
                <div>
                  <dt>Unit price</dt>
                  <dd>{price?.unitPrice ?? "-"}</dd>
                </div>
                {averageCost !== null && (
                  <div>
                    <dt>Avg cost</dt>
                    <dd>{formatUnitGold(averageCost)}</dd>
                  </div>
                )}
                <div>
                  <dt>Quantity</dt>
                  <dd>{quantity}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{price ? `${price.unitPrice * quantity} Gold` : "-"}</dd>
                </div>
              </dl>
              {mode === "sell" && (
                <p className={styles.tradePreview}>
                  Profit:{" "}
                  <span
                    data-profit={
                      profit === null ? undefined : profit > 0 ? "positive" : profit < 0 ? "negative" : "neutral"
                    }
                  >
                    {profit === null ? "-" : `${profit > 0 ? "+" : ""}${profit} Gold`}
                  </span>
                </p>
              )}
              <div className={styles.priceContext}>
                <span>{price?.label ?? "Trade unavailable"}</span>
                <span>Session net {state.marketSession.netTrade[productId] ?? 0}</span>
              </div>
              {locallyProduced && <p className={styles.localSaleWarning}>Local product. Low local sale value.</p>}
              <QuantityControl
                label={`${product?.name ?? productId} ${mode} quantity`}
                value={quantity}
                min={maximum > 0 ? 1 : 0}
                max={maximum}
                disabled={maximum === 0}
                onChange={(nextQuantity) => setDrafts((current) => ({ ...current, [productId]: nextQuantity }))}
              />
              <button
                className={styles.primaryButton}
                type="button"
                disabled={maximum === 0}
                aria-describedby={reason ? reasonId : undefined}
                onClick={() =>
                  mode === "buy" ? store.buyProduct(productId, quantity) : store.sellProduct(productId, quantity)
                }
              >
                {mode === "buy" ? "Buy" : "Sell"} {quantity}
              </button>
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
