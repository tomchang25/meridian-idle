"use client";

import { useGameStore } from "@/game/application/use-game-store";
import { getPort, getProduct, ROUTES } from "@/game/domain/content/core-content";
import { SUPPLY_IDS } from "@/game/domain/models/game";
import { supplyPurchaseError, usedCargo } from "@/game/domain/rules/cargo";
import { buyPrice, productPurchaseError, sellPrice } from "@/game/domain/rules/market";
import { portLevel, xpThreshold } from "@/game/domain/rules/progression";
import { voyageDepartureError } from "@/game/domain/rules/voyage";
import styles from "./meridian-dashboard.module.css";

export function MeridianDashboard() {
  const store = useGameStore();
  const { state, saveStatus } = store;

  if (saveStatus === "loading")
    return (
      <main className={styles.stateScreen} aria-busy="true">
        <section className={styles.stateCard} aria-labelledby="loading-title">
          <p className={styles.eyebrow}>Captain&apos;s log</p>
          <h1 id="loading-title">Meridian Idle</h1>
          <p>Loading your logbook...</p>
        </section>
      </main>
    );

  if (saveStatus === "corrupt")
    return (
      <main className={styles.stateScreen}>
        <section className={styles.stateCard} aria-labelledby="recovery-title">
          <p className={styles.eyebrow}>Logbook recovery</p>
          <h1 id="recovery-title">Meridian Idle</h1>
          <p role="alert">This save cannot be read. It has not been overwritten.</p>
          <button className={styles.primaryButton} type="button" onClick={store.startNewGame}>
            Start a new V5 game
          </button>
        </section>
      </main>
    );

  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);
  const level = portLevel(state, state.fleet.locationPortId);
  const voyage = state.voyage;
  const saveLabel =
    saveStatus === "saving"
      ? "Saving locally"
      : saveStatus === "unavailable"
        ? "Local save unavailable; session not saved"
        : "Saved locally";
  const showMigration = state.migrationReport && !state.migrationReport.acknowledged;

  return (
    <main className={styles.shell} data-voyage-state={voyage ? "transit" : "docked"}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.eyebrow}>Maritime ledger</span>
          <strong>Meridian Idle</strong>
        </div>
        <div className={styles.resourceStrip} aria-label="Fleet resources">
          <span>
            <small>Gold</small> {state.fleet.gold.toLocaleString("en-US")}
          </span>
          <span>
            <small>Cargo</small> {cargo}/{state.fleet.cargoCapacity}
          </span>
          <span>
            <small>Fleet HP</small> {state.fleet.hp}/{state.fleet.maxHp}
          </span>
        </div>
        <p className={styles.saveState} data-status={saveStatus} role="status">
          {saveLabel}
        </p>
      </header>

      <div className={styles.dashboard}>
        <section className={styles.portOverview} aria-labelledby="port">
          <div className={styles.portIdentity}>
            <p className={styles.eyebrow}>Current port</p>
            <h1 id="port">{port?.name ?? "Unknown Port"}</h1>
            <p>{voyage ? "Fleet underway" : "Fleet docked and ready for orders"}</p>
          </div>
          <dl className={styles.summaryGrid}>
            <div>
              <dt>Gold reserve</dt>
              <dd>{state.fleet.gold.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>Port standing</dt>
              <dd>
                Level {level} <small>{state.portProgress[state.fleet.locationPortId]?.xp ?? 0} XP</small>
              </dd>
            </div>
            <div>
              <dt>Next milestone</dt>
              <dd>{xpThreshold(Math.min(100, level + 1))} XP</dd>
            </div>
            <div>
              <dt>Fleet readiness</dt>
              <dd>
                {state.fleet.attack} attack{" "}
                <small>
                  {cargo}/{state.fleet.cargoCapacity} cargo
                </small>
              </dd>
            </div>
          </dl>
        </section>

        {(store.commandError || showMigration) && (
          <div className={styles.feedbackStack}>
            {store.commandError && (
              <section className={styles.alertPanel} aria-labelledby="command-error-title">
                <h2 id="command-error-title">Command issue</h2>
                <p role="alert">Command failed: {store.commandError}</p>
              </section>
            )}
            {showMigration && (
              <section className={styles.migrationPanel} aria-labelledby="migration">
                <div>
                  <p className={styles.eyebrow}>Recovered voyage</p>
                  <h2 id="migration">V3 migration report</h2>
                  <p>Your Gold was preserved. Dropped V3 data:</p>
                  <ul>
                    {state.migrationReport?.droppedFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
                <button className={styles.secondaryButton} type="button" onClick={store.acknowledgeMigration}>
                  Acknowledge migration report
                </button>
              </section>
            )}
          </div>
        )}

        <div className={styles.workspace} data-mode={voyage ? "transit" : "docked"}>
          {voyage ? (
            <section className={`${styles.panel} ${styles.voyagePanel}`} aria-labelledby="voyage">
              <div className={styles.panelHeading}>
                <div>
                  <p className={styles.eyebrow}>Open water</p>
                  <h2 id="voyage">Voyage in progress</h2>
                </div>
                <span className={styles.statusBadge}>Risk {voyage.staticRisk}</span>
              </div>
              <div className={styles.voyageRoute}>
                <span>Destination</span>
                <strong>{getPort(voyage.destinationPortId)?.name ?? "Unknown Port"}</strong>
              </div>
              <dl className={styles.detailGrid}>
                <div>
                  <dt>Committed Food/Water</dt>
                  <dd>{voyage.supplyCost}</dd>
                </div>
                <div>
                  <dt>Scheduled arrival</dt>
                  <dd>{new Date(voyage.plannedArrivesAt).toLocaleTimeString()}</dd>
                </div>
                <div>
                  <dt>Fleet condition</dt>
                  <dd>
                    {state.fleet.hp}/{state.fleet.maxHp} HP
                  </dd>
                </div>
              </dl>
              <button className={styles.primaryButton} type="button" onClick={store.resolveVoyage}>
                Check arrival
              </button>
            </section>
          ) : (
            <>
              <section className={`${styles.panel} ${styles.marketPanel}`} aria-labelledby="market">
                <div className={styles.panelHeading}>
                  <div>
                    <p className={styles.eyebrow}>Port exchange</p>
                    <h2 id="market">Market</h2>
                  </div>
                  <span className={styles.sessionLabel}>Session {state.marketSession.id}</span>
                </div>
                <p className={styles.panelIntro}>
                  Compare local prices before filling the hold. Specialty supply: {state.marketSession.specialtySupply}.
                </p>
                <ul className={styles.tradeList}>
                  {port?.catalog.map((entry) => {
                    const product = getProduct(entry.productId);
                    const buy = buyPrice(state, entry.productId);
                    const sell = sellPrice(state, entry.productId);
                    const held = state.fleet.products[entry.productId]?.quantity ?? 0;
                    const locked = level < entry.unlockLevel;
                    const purchaseError = productPurchaseError(state, entry.productId, 1);
                    const purchaseReasonId = `buy-${entry.productId}-reason`;
                    return (
                      <li className={styles.tradeCard} data-locked={locked || undefined} key={entry.productId}>
                        <div className={styles.cardHeading}>
                          <strong>{product?.name ?? entry.productId}</strong>
                          <span className={styles.statusBadge}>
                            Lv.{entry.unlockLevel} {locked ? "locked" : "available"}
                          </span>
                        </div>
                        <dl className={styles.priceGrid}>
                          <div>
                            <dt>Reference</dt>
                            <dd>{buy?.reference ?? "-"}</dd>
                          </div>
                          <div>
                            <dt>Buy</dt>
                            <dd>
                              {buy?.unitPrice ?? "-"} <small>{buy?.label}</small>
                            </dd>
                          </div>
                          <div>
                            <dt>Sell</dt>
                            <dd>
                              {sell?.unitPrice ?? "-"} <small>{sell?.label}</small>
                            </dd>
                          </div>
                          <div>
                            <dt>Fleet ledger</dt>
                            <dd>
                              {held} held <small>{state.marketSession.netTrade[entry.productId] ?? 0} net</small>
                            </dd>
                          </div>
                        </dl>
                        <div className={styles.buttonRow}>
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
                            onClick={() => store.sellProduct(entry.productId)}
                          >
                            Sell 1
                          </button>
                        </div>
                        {purchaseError && (
                          <p className={styles.unavailableReason} id={purchaseReasonId}>
                            <strong>Unavailable:</strong> {purchaseError}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={`${styles.panel} ${styles.cargoPanel}`} aria-labelledby="cargo-heading">
                <div className={styles.panelHeading}>
                  <div>
                    <p className={styles.eyebrow}>Fleet manifest</p>
                    <h2 id="cargo-heading">Product Cargo</h2>
                  </div>
                  <span className={styles.statusBadge}>
                    {cargo}/{state.fleet.cargoCapacity} used
                  </span>
                </div>
                {Object.keys(state.fleet.products).length === 0 ? (
                  <p className={styles.emptyState}>No Product Cargo is held.</p>
                ) : (
                  <ul className={styles.manifestList}>
                    {Object.entries(state.fleet.products).map(([productId, stack]) => {
                      const price = sellPrice(state, productId);
                      return (
                        <li key={productId}>
                          <div>
                            <strong>{getProduct(productId)?.name ?? productId}</strong>
                            <span>
                              {stack.quantity} held · basis {stack.totalCostBasis}
                            </span>
                          </div>
                          <div className={styles.manifestAction}>
                            <span>
                              {price?.unitPrice ?? "-"} {price?.label}
                            </span>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              onClick={() => store.sellProduct(productId)}
                            >
                              Sell 1
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className={`${styles.panel} ${styles.provisioningPanel}`} aria-labelledby="provisioning">
                <div className={styles.panelHeading}>
                  <div>
                    <p className={styles.eyebrow}>Stores</p>
                    <h2 id="provisioning">Provisioning</h2>
                  </div>
                </div>
                <ul className={styles.supplyList}>
                  {SUPPLY_IDS.map((id) => {
                    const purchaseError = supplyPurchaseError(state, id, 1);
                    const purchaseReasonId = `buy-${id}-reason`;
                    return (
                      <li key={id}>
                        <div className={styles.supplyHeading}>
                          <strong>{id === "food" ? "Food" : "Water"}</strong>
                          <span>
                            {state.fleet.supplies[id].quantity} aboard · {port?.supplyPrices[id] ?? "-"} Gold
                          </span>
                        </div>
                        <div className={styles.buttonRow}>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            disabled={purchaseError !== null}
                            aria-describedby={purchaseError ? purchaseReasonId : undefined}
                            onClick={() => store.buySupply(id, 1)}
                          >
                            Buy 1
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={state.fleet.supplies[id].quantity === 0}
                            onClick={() => store.discardSupply(id, 1)}
                          >
                            Discard 1
                          </button>
                        </div>
                        {purchaseError && (
                          <p className={styles.unavailableReason} id={purchaseReasonId}>
                            <strong>Unavailable:</strong> {purchaseError}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={`${styles.panel} ${styles.routesPanel}`} aria-labelledby="routes">
                <div className={styles.panelHeading}>
                  <div>
                    <p className={styles.eyebrow}>Departure board</p>
                    <h2 id="routes">Routes</h2>
                  </div>
                </div>
                <ul className={styles.routeList}>
                  {ROUTES.filter((route) => route.originPortId === state.fleet.locationPortId).map((route) => {
                    const departureError = voyageDepartureError(state, route.id);
                    const unavailableReason = !store.canGenerateVoyageSeed
                      ? "Secure randomness is unavailable."
                      : departureError;
                    const departureReasonId = `depart-${route.id}-reason`;
                    return (
                      <li key={route.id}>
                        <div className={styles.cardHeading}>
                          <strong>{getPort(route.destinationPortId)?.name ?? "Unknown Port"}</strong>
                          <span className={styles.statusBadge}>Risk {route.staticRisk}</span>
                        </div>
                        <p>
                          {route.durationMilliseconds / 1000}s passage · Food {route.requiredSupplies.food} · Water{" "}
                          {route.requiredSupplies.water}
                        </p>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          disabled={unavailableReason !== null}
                          aria-describedby={unavailableReason ? departureReasonId : undefined}
                          onClick={() => store.departVoyage(route.id)}
                        >
                          Depart
                        </button>
                        {unavailableReason && (
                          <p className={styles.unavailableReason} id={departureReasonId}>
                            <strong>Unavailable:</strong> {unavailableReason}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </div>

        {state.latestVoyageResult && (
          <section className={styles.resultPanel} aria-labelledby="latest-arrival" aria-live="polite">
            <div>
              <p className={styles.eyebrow}>Latest result</p>
              <h2 id="latest-arrival">Latest arrival</h2>
            </div>
            <p>
              Arrived at {getPort(state.latestVoyageResult.destinationPortId)?.name}; source XP gained{" "}
              {state.latestVoyageResult.sourceXpGained}; committed supply cost {state.latestVoyageResult.supplyCost}.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
