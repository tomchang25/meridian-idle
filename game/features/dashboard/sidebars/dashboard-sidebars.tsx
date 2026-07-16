import { getPort, getProduct } from "@/game/domain/content/core-content";
import { SUPPLY_IDS, type V5GameState } from "@/game/domain/models/game";
import { usedCargo } from "@/game/domain/rules/cargo";
import { sellPrice } from "@/game/domain/rules/market";
import { portLevel, xpThreshold } from "@/game/domain/rules/progression";
import { displayName, SUPPLY_LABELS } from "../dashboard-helpers";
import styles from "../meridian-dashboard.module.css";

type DashboardSidebarProps = {
  state: V5GameState;
};

export function LongTermSidebar({ state }: DashboardSidebarProps) {
  const port = getPort(state.fleet.locationPortId);
  const regionName = displayName(port?.regionId ?? "unknown waters");

  return (
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
            <dd>{state.voyage ? "Underway" : "Docked"}</dd>
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
  );
}

export function ShortTermSidebar({ state }: DashboardSidebarProps) {
  const port = getPort(state.fleet.locationPortId);
  const cargo = usedCargo(state);
  const level = portLevel(state, state.fleet.locationPortId);

  return (
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
  );
}
