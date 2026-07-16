"use client";

import { useGameStore } from "@/game/application/use-game-store";
import { getPort, getProduct, ROUTES } from "@/game/domain/content/core-content";
import { SUPPLY_IDS } from "@/game/domain/models/game";
import { supplyPurchaseError, usedCargo } from "@/game/domain/rules/cargo";
import { buyPrice, productPurchaseError, sellPrice } from "@/game/domain/rules/market";
import { portLevel, xpThreshold } from "@/game/domain/rules/progression";
import { voyageDepartureError } from "@/game/domain/rules/voyage";

export function MeridianDashboard() {
  const store = useGameStore();
  const { state, saveStatus } = store;
  if (saveStatus === "loading") return <main aria-busy="true">Loading your logbook…</main>;
  if (saveStatus === "corrupt")
    return (
      <main>
        <h1>Meridian Idle</h1>
        <p role="alert">This save cannot be read. It has not been overwritten.</p>
        <button type="button" onClick={store.startNewGame}>
          Start a new V5 game
        </button>
      </main>
    );
  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);
  const level = portLevel(state, state.fleet.locationPortId);
  const voyage = state.voyage;
  return (
    <main>
      <header>
        <p>Meridian Idle</p>
        <p>Save status: {saveStatus === "unavailable" ? "Local save unavailable" : "Saved"}</p>
      </header>
      {store.commandError && <p role="alert">Command failed: {store.commandError}</p>}
      <section aria-labelledby="port">
        <p>Current port</p>
        <h1 id="port">{port?.name ?? "Unknown Port"}</h1>
        <p>Gold {state.fleet.gold.toLocaleString("en-US")}</p>
        <p>
          Port Level {level} · {state.portProgress[state.fleet.locationPortId]?.xp ?? 0} XP · next milestone{" "}
          {xpThreshold(Math.min(100, level + 1))}
        </p>
        <p>
          Fleet HP {state.fleet.hp}/{state.fleet.maxHp} · Attack {state.fleet.attack} · Cargo {cargo}/
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
          <button type="button" onClick={store.acknowledgeMigration}>
            Acknowledge migration report
          </button>
        </section>
      )}
      {voyage ? (
        <section aria-labelledby="voyage">
          <h2 id="voyage">Voyage in progress</h2>
          <p>
            Destination {getPort(voyage.destinationPortId)?.name} · static risk {voyage.staticRisk} · committed
            Food/Water cost {voyage.supplyCost}
          </p>
          <p>Arrival is scheduled for {new Date(voyage.plannedArrivesAt).toLocaleTimeString()}.</p>
          <button type="button" onClick={store.resolveVoyage}>
            Check arrival
          </button>
        </section>
      ) : (
        <>
          <section aria-labelledby="market">
            <h2 id="market">Market</h2>
            <p>
              Session {state.marketSession.id} · Specialty supply {state.marketSession.specialtySupply}
            </p>
            <ul>
              {port?.catalog.map((entry) => {
                const product = getProduct(entry.productId);
                const buy = buyPrice(state, entry.productId);
                const sell = sellPrice(state, entry.productId);
                const held = state.fleet.products[entry.productId]?.quantity ?? 0;
                const locked = level < entry.unlockLevel;
                const purchaseError = productPurchaseError(state, entry.productId, 1);
                const purchaseReasonId = `buy-${entry.productId}-reason`;
                return (
                  <li key={entry.productId}>
                    <strong>{product?.name}</strong> · Lv.{entry.unlockLevel} {locked ? "locked" : "available"} ·
                    reference {buy?.reference} · buy {buy?.unitPrice} ({buy?.label}) · sell {sell?.unitPrice} (
                    {sell?.label}) · held {held} · net trade {state.marketSession.netTrade[entry.productId] ?? 0}{" "}
                    <button
                      type="button"
                      disabled={purchaseError !== null}
                      aria-describedby={purchaseError ? purchaseReasonId : undefined}
                      onClick={() => store.buyProduct(entry.productId)}
                    >
                      Buy 1
                    </button>{" "}
                    <button type="button" disabled={held === 0} onClick={() => store.sellProduct(entry.productId)}>
                      Sell 1
                    </button>
                    {purchaseError && <span id={purchaseReasonId}> Unavailable: {purchaseError}</span>}
                  </li>
                );
              })}
            </ul>
            <h3>Fleet products</h3>
            {Object.keys(state.fleet.products).length === 0 ? (
              <p>No Product Cargo is held.</p>
            ) : (
              <ul>
                {Object.entries(state.fleet.products).map(([productId, stack]) => {
                  const price = sellPrice(state, productId);
                  return (
                    <li key={productId}>
                      {getProduct(productId)?.name}: {stack.quantity} held · basis {stack.totalCostBasis} · sell{" "}
                      {price?.unitPrice} ({price?.label}){" "}
                      <button type="button" onClick={() => store.sellProduct(productId)}>
                        Sell 1
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="provisioning">
            <h2 id="provisioning">Provisioning</h2>
            <ul>
              {SUPPLY_IDS.map((id) => {
                const purchaseError = supplyPurchaseError(state, id, 1);
                const purchaseReasonId = `buy-${id}-reason`;
                return (
                  <li key={id}>
                    {id}: {state.fleet.supplies[id].quantity} · cost {port?.supplyPrices[id]}{" "}
                    <button
                      type="button"
                      disabled={purchaseError !== null}
                      aria-describedby={purchaseError ? purchaseReasonId : undefined}
                      onClick={() => store.buySupply(id, 1)}
                    >
                      Buy 1
                    </button>{" "}
                    <button
                      type="button"
                      disabled={state.fleet.supplies[id].quantity === 0}
                      onClick={() => store.discardSupply(id, 1)}
                    >
                      Discard 1
                    </button>
                    {purchaseError && <span id={purchaseReasonId}> Unavailable: {purchaseError}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
          <section aria-labelledby="routes">
            <h2 id="routes">Routes</h2>
            <ul>
              {ROUTES.filter((route) => route.originPortId === state.fleet.locationPortId).map((route) => {
                const departureError = voyageDepartureError(state, route.id);
                const unavailableReason = !store.canGenerateVoyageSeed
                  ? "Secure randomness is unavailable."
                  : departureError;
                const departureReasonId = `depart-${route.id}-reason`;
                return (
                  <li key={route.id}>
                    {getPort(route.destinationPortId)?.name} · {route.durationMilliseconds / 1000}s · risk{" "}
                    {route.staticRisk} · Food {route.requiredSupplies.food} / Water {route.requiredSupplies.water}{" "}
                    <button
                      type="button"
                      disabled={unavailableReason !== null}
                      aria-describedby={unavailableReason ? departureReasonId : undefined}
                      onClick={() => store.departVoyage(route.id)}
                    >
                      Depart
                    </button>
                    {unavailableReason && <span id={departureReasonId}> Unavailable: {unavailableReason}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
      {state.latestVoyageResult && (
        <section aria-live="polite">
          <h2>Latest arrival</h2>
          <p>
            Arrived at {getPort(state.latestVoyageResult.destinationPortId)?.name}; source XP gained{" "}
            {state.latestVoyageResult.sourceXpGained}; committed supply cost {state.latestVoyageResult.supplyCost}.
          </p>
        </section>
      )}
    </main>
  );
}
