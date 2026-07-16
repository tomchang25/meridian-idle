"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/game/application/use-game-store";
import { getPort, getProduct, getProductFamilyForProduct, ROUTES } from "@/game/domain/content/core-content";
import { SUPPLY_IDS, type SupplyId } from "@/game/domain/models/game";
import { supplyPurchaseError, usedCargo } from "@/game/domain/rules/cargo";
import { buyPrice, productPurchaseError, sellPrice } from "@/game/domain/rules/market";
import { portLevel, xpThreshold } from "@/game/domain/rules/progression";
import { voyageDepartureError } from "@/game/domain/rules/voyage";
import styles from "./meridian-dashboard.module.css";

type CityAction = "market" | "supplies" | "harbor";

const CITY_ACTIONS: { id: CityAction; label: string; shortLabel: string }[] = [
  { id: "market", label: "Market", shortLabel: "M" },
  { id: "supplies", label: "Supplies Management", shortLabel: "S" },
  { id: "harbor", label: "Harbor", shortLabel: "H" },
];

const SUPPLY_LABELS: Record<SupplyId, string> = {
  food: "Food",
  water: "Water",
  medicine: "Medicine",
  rope: "Rope",
  sails: "Sails",
};

function displayName(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MeridianDashboard() {
  const store = useGameStore();
  const { state, saveStatus } = store;
  const [cityAction, setCityAction] = useState<CityAction>("market");
  const [displayNow, setDisplayNow] = useState(0);
  const voyage = state.voyage;

  useEffect(() => {
    if (!voyage) return;
    const updateClock = () => setDisplayNow(Date.now());
    const frame = window.requestAnimationFrame(updateClock);
    const timer = window.setInterval(updateClock, 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [voyage]);

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

  const port = getPort(state.fleet.locationPortId);
  const destinationPort = voyage ? getPort(voyage.destinationPortId) : undefined;
  const cargo = usedCargo(state);
  const level = portLevel(state, state.fleet.locationPortId);
  const routes = ROUTES.filter((route) => route.originPortId === state.fleet.locationPortId);
  const regionName = displayName(port?.regionId ?? "unknown waters");
  const saveLabel =
    saveStatus === "saving"
      ? "Saving locally"
      : saveStatus === "unavailable"
        ? "Local save unavailable; session not saved"
        : "Saved locally";
  const showMigration = state.migrationReport && !state.migrationReport.acknowledged;

  const voyageDuration = voyage ? Math.max(1, voyage.plannedArrivesAt - voyage.departedAt) : 1;
  const voyageElapsed = voyage
    ? Math.min(voyageDuration, Math.max(0, (displayNow || voyage.departedAt) - voyage.departedAt))
    : 0;
  const voyageProgress = Math.floor((voyageElapsed / voyageDuration) * 100);
  const voyageRemaining = voyageDuration - voyageElapsed;

  return (
    <main className={styles.shell} data-voyage-state={voyage ? "transit" : "docked"}>
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

      <div className={styles.hudGrid}>
        <aside className={styles.leftSidebar} aria-label="Long-term status">
          <section className={styles.sidebarSection} aria-labelledby="captain-summary">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>01</span>
              <div>
                <p>Player status</p>
                <h2 id="captain-summary">Captain Profile</h2>
              </div>
            </div>
            <div className={styles.placeholderCard}>
              <span>Planned system</span>
              <strong>Captain records are not available in V5 Core.</strong>
              <p>This space is reserved for future long-term player progression.</p>
            </div>
          </section>

          <section className={styles.sidebarSection} aria-labelledby="fleet-summary">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>02</span>
              <div>
                <p>Active vessel</p>
                <h2 id="fleet-summary">Fleet Summary</h2>
              </div>
            </div>
            <div className={styles.fleetName}>
              <span className={styles.shipSeal} aria-hidden="true">
                F
              </span>
              <div>
                <strong>Player Fleet</strong>
                <span>Single active trade fleet</span>
              </div>
            </div>
            <dl className={styles.statList}>
              <div>
                <dt>Hull</dt>
                <dd>
                  {state.fleet.hp} / {state.fleet.maxHp}
                </dd>
              </div>
              <div>
                <dt>Attack</dt>
                <dd>{state.fleet.attack}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>{state.fleet.cargoCapacity} units</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{voyage ? "Underway" : "Docked"}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.sidebarSection} aria-labelledby="region-summary">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>03</span>
              <div>
                <p>Known waters</p>
                <h2 id="region-summary">{regionName}</h2>
              </div>
            </div>
            <div className={styles.regionMap} aria-hidden="true">
              <span className={styles.routeLine} />
              <span className={`${styles.portDot} ${styles.portLisbon}`}>L</span>
              <span className={`${styles.portDot} ${styles.portFaro}`}>F</span>
              <span className={`${styles.portDot} ${styles.portTangier}`}>T</span>
            </div>
            <ul className={styles.portProgressList}>
              {state.world.knownPortIds.map((portId) => {
                const knownPort = getPort(portId);
                const knownLevel = portLevel(state, portId);
                return (
                  <li key={portId}>
                    <div>
                      <span>{knownPort?.name ?? displayName(portId)}</span>
                      <strong>Level {knownLevel}</strong>
                    </div>
                    <progress aria-label={`${knownPort?.name ?? portId} progression`} max="100" value={knownLevel}>
                      {knownLevel}%
                    </progress>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        <div className={styles.mainColumn}>
          <section className={styles.scenePanel} aria-labelledby="scene-title">
            <div className={styles.sceneCopy}>
              <p>
                {voyage
                  ? `${displayName(getPort(voyage.originPortId)?.regionId ?? "open water")} / Open Water`
                  : `${regionName} / ${port?.name ?? "Unknown Port"}`}
              </p>
              <h2 id="scene-title">
                {voyage
                  ? `Underway to ${destinationPort?.name ?? "Unknown Port"}`
                  : `Port operations at ${port?.name ?? "Unknown Port"}`}
              </h2>
              <div className={styles.sceneTags}>
                <span>{voyage ? "Underway" : "Docked"}</span>
                {voyage ? <span>Static risk {Math.round(voyage.staticRisk * 100)}%</span> : <span>Market open</span>}
              </div>
            </div>

            <div className={styles.pixelScene} aria-hidden="true">
              <div className={styles.pixelSun} />
              <div className={`${styles.pixelCloud} ${styles.cloudOne}`} />
              <div className={`${styles.pixelCloud} ${styles.cloudTwo}`} />
              <div className={styles.farHills} />

              {!voyage ? (
                <>
                  <div className={`${styles.pixelBuilding} ${styles.buildingOne}`} />
                  <div className={`${styles.pixelBuilding} ${styles.buildingTwo}`} />
                  <div className={`${styles.pixelBuilding} ${styles.buildingThree}`} />
                  <div className={styles.harborTower} />
                  <div className={styles.harborWall} />
                  <div className={styles.dockCrane} />
                  <div className={`${styles.pixelShip} ${styles.dockedShip}`}>
                    <span className={styles.shipMast} />
                    <span className={styles.shipSail} />
                    <span className={styles.shipFlag} />
                    <span className={styles.shipHull} />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.distantCoast} />
                  <div className={`${styles.pixelShip} ${styles.voyageShip}`}>
                    <span className={styles.shipMast} />
                    <span className={styles.shipSail} />
                    <span className={styles.shipFlag} />
                    <span className={styles.shipHull} />
                  </div>
                </>
              )}

              <div className={styles.pixelWater}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.sceneFrame} aria-hidden="true" />
          </section>

          {(store.commandError || showMigration) && (
            <div className={styles.feedbackStack}>
              {store.commandError && (
                <section className={styles.alertPanel} aria-labelledby="command-error-title">
                  <p>Command issue</p>
                  <h2 id="command-error-title">Order could not be completed</h2>
                  <span role="alert">Command failed: {store.commandError}</span>
                </section>
              )}
              {showMigration && (
                <section className={styles.migrationPanel} aria-labelledby="migration">
                  <div>
                    <p>Recovered voyage</p>
                    <h2 id="migration">V3 migration report</h2>
                    <span>Your Gold was preserved. Dropped V3 data:</span>
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

          <section className={styles.actionPanel} aria-labelledby="action-panel-title">
            {voyage ? (
              <div className={styles.voyageStatus}>
                <div className={styles.voyageHeader}>
                  <div>
                    <p>Voyage in progress</p>
                    <h2 id="action-panel-title">
                      {getPort(voyage.originPortId)?.name ?? "Unknown Port"} to{" "}
                      {destinationPort?.name ?? "Unknown Port"}
                    </h2>
                  </div>
                  <span className={styles.voyageBadge}>Risk {Math.round(voyage.staticRisk * 100)}%</span>
                </div>
                <div className={styles.routeTrack} aria-hidden="true">
                  <span>{getPort(voyage.originPortId)?.name ?? "Origin"}</span>
                  <i />
                  <b>{voyageProgress}%</b>
                  <i />
                  <span>{destinationPort?.name ?? "Destination"}</span>
                </div>
                <progress
                  className={styles.voyageProgress}
                  aria-label="Voyage progress"
                  max="100"
                  value={voyageProgress}
                >
                  {voyageProgress}%
                </progress>
                <dl className={styles.voyageFacts}>
                  <div>
                    <dt>Remaining</dt>
                    <dd>{formatRemaining(voyageRemaining)}</dd>
                  </div>
                  <div>
                    <dt>Committed</dt>
                    <dd>
                      Food {voyage.requiredSupplies.food} / Water {voyage.requiredSupplies.water}
                    </dd>
                  </div>
                  <div>
                    <dt>Supply cost</dt>
                    <dd>{voyage.supplyCost} Gold basis</dd>
                  </div>
                </dl>
                <div className={styles.atSeaMessage}>
                  <span aria-hidden="true">~</span>
                  <div>
                    <strong>City operations are unavailable at sea.</strong>
                    <p>Arrival resolves automatically when the planned Voyage time is reached.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.actionPanelHeading}>
                  <div>
                    <p>{port?.name ?? "Unknown Port"} command office</p>
                    <h2 id="action-panel-title">City Actions</h2>
                  </div>
                  <span>Session {state.marketSession.id}</span>
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
                  {cityAction === "market" && (
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
                  )}

                  {cityAction === "supplies" && (
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
                  )}

                  {cityAction === "harbor" && (
                    <section aria-labelledby="harbor-command">
                      <div className={styles.workspaceHeading}>
                        <div>
                          <p>Departure board</p>
                          <h3>Choose Next Port</h3>
                        </div>
                        <div className={styles.marketPulse}>
                          <span>Current berth</span>
                          <strong>{port?.name ?? "Unknown Port"}</strong>
                        </div>
                      </div>
                      <p className={styles.workspaceIntro}>
                        Every departure commits the listed Food and Water before the Voyage begins.
                      </p>
                      <ul className={styles.harborRoutes}>
                        {routes.map((route) => {
                          const routeDestination = getPort(route.destinationPortId);
                          const departureError = voyageDepartureError(state, route.id);
                          const unavailableReason = !store.canGenerateVoyageSeed
                            ? "Secure randomness is unavailable."
                            : departureError;
                          const departureReasonId = `depart-${route.id}-reason`;
                          return (
                            <li key={route.id}>
                              <div className={styles.routeCompass} aria-hidden="true">
                                {route.distance}
                              </div>
                              <div className={styles.routeIdentity}>
                                <span>{displayName(routeDestination?.regionId ?? "unknown waters")}</span>
                                <strong>{routeDestination?.name ?? "Unknown Port"}</strong>
                                <p>{route.distance} distance units across an authored trade route.</p>
                              </div>
                              <dl>
                                <div>
                                  <dt>Duration</dt>
                                  <dd>{formatRemaining(route.durationMilliseconds)}</dd>
                                </div>
                                <div>
                                  <dt>Risk</dt>
                                  <dd>{Math.round(route.staticRisk * 100)}%</dd>
                                </div>
                                <div>
                                  <dt>Supplies</dt>
                                  <dd>
                                    Food {route.requiredSupplies.food} / Water {route.requiredSupplies.water}
                                  </dd>
                                </div>
                              </dl>
                              <button
                                className={styles.primaryButton}
                                type="button"
                                disabled={unavailableReason !== null}
                                aria-describedby={unavailableReason ? departureReasonId : undefined}
                                onClick={() => store.departVoyage(route.id)}
                              >
                                Depart for {routeDestination?.name ?? "destination"}
                              </button>
                              {unavailableReason && (
                                <p className={styles.unavailableReason} id={departureReasonId}>
                                  {unavailableReason}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>
              </>
            )}
          </section>

          <section className={styles.activityPanel} aria-labelledby="activity-title">
            <div className={styles.activityHeading}>
              <div>
                <p>Captain&apos;s record</p>
                <h2 id="activity-title">Activity Log</h2>
              </div>
              <span>All entries / newest first</span>
            </div>
            {state.latestVoyageResult && (
              <div className={styles.latestResult} aria-live="polite">
                <div>
                  <h3>Latest arrival</h3>
                  <strong>{getPort(state.latestVoyageResult.destinationPortId)?.name ?? "Unknown Port"}</strong>
                </div>
                <p>
                  Source XP gained {state.latestVoyageResult.sourceXpGained}; committed supply cost{" "}
                  {state.latestVoyageResult.supplyCost}.
                </p>
              </div>
            )}
            <ol className={styles.activityList}>
              {state.activity.map((entry) => (
                <li key={entry.id} data-tone={entry.tone}>
                  <time dateTime={new Date(entry.at).toISOString()}>
                    {new Date(entry.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  <span>{displayName(entry.tone)}</span>
                  <p>{entry.message}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className={styles.rightSidebar} aria-label="Short-term status">
          <section className={styles.ledgerSection} aria-labelledby="cargo-details">
            <div className={styles.ledgerHeading}>
              <div>
                <p>Short-term ledger</p>
                <h2 id="cargo-details">Product Cargo</h2>
              </div>
              <strong>
                {cargo} / {state.fleet.cargoCapacity}
              </strong>
            </div>
            <progress
              className={styles.capacityProgress}
              aria-label="Cargo capacity"
              max={state.fleet.cargoCapacity}
              value={cargo}
            >
              {cargo} of {state.fleet.cargoCapacity}
            </progress>
            <div className={styles.capacityLabels}>
              <span>{Math.round((cargo / state.fleet.cargoCapacity) * 100)}% occupied</span>
              <span>{state.fleet.cargoCapacity - cargo} units free</span>
            </div>
            {Object.keys(state.fleet.products).length === 0 ? (
              <p className={styles.emptyState}>No Product Cargo is held.</p>
            ) : (
              <ul className={styles.cargoLedger}>
                {Object.entries(state.fleet.products).map(([productId, stack]) => {
                  const price = sellPrice(state, productId);
                  return (
                    <li key={productId}>
                      <div>
                        <strong>{getProduct(productId)?.name ?? productId}</strong>
                        <span>{stack.quantity} units</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Basis</dt>
                          <dd>{stack.totalCostBasis}</dd>
                        </div>
                        <div>
                          <dt>Local sale</dt>
                          <dd>{price ? price.unitPrice * stack.quantity : "-"}</dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.ledgerSection} aria-labelledby="provision-details">
            <div className={styles.ledgerHeading}>
              <div>
                <p>Voyage stores</p>
                <h2 id="provision-details">Provisioning</h2>
              </div>
              <strong>{SUPPLY_IDS.reduce((sum, id) => sum + state.fleet.supplies[id].quantity, 0)} units</strong>
            </div>
            <ul className={styles.provisionLedger}>
              {SUPPLY_IDS.map((supplyId) => {
                const stack = state.fleet.supplies[supplyId];
                return (
                  <li key={supplyId}>
                    <span className={styles.supplyIcon} aria-hidden="true">
                      {SUPPLY_LABELS[supplyId].slice(0, 1)}
                    </span>
                    <div>
                      <strong>{SUPPLY_LABELS[supplyId]}</strong>
                      <span>
                        {stack.totalCostBasis} Gold basis / {port?.supplyPrices[supplyId] ?? "-"} local
                      </span>
                    </div>
                    <b>{stack.quantity}</b>
                  </li>
                );
              })}
            </ul>
            <div className={styles.progressCard}>
              <span>Current Port standing</span>
              <strong>
                Level {level} / {state.portProgress[state.fleet.locationPortId]?.xp ?? 0} XP
              </strong>
              <p>Next level threshold: {xpThreshold(Math.min(100, level + 1))} XP.</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
