import { getPort, getProduct } from "@/game/domain/content/core-content";
import { SUPPLY_IDS, type V5GameState } from "@/game/domain/models/game";
import { averageUnitCost, usedCargo } from "@/game/domain/rules/cargo";
import { sellPrice } from "@/game/domain/rules/market";
import { portLevel, xpThreshold } from "@/game/domain/rules/progression";
import { displayName, formatUnitGold, SUPPLY_LABELS } from "../dashboard-helpers";
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
  const products = Object.entries(state.fleet.products);
  const productsCargo = products.reduce((sum, [, stack]) => sum + stack.quantity, 0);
  const suppliesCargo = SUPPLY_IDS.reduce((sum, id) => sum + state.fleet.supplies[id].quantity, 0);
  const freeCargo = state.fleet.cargoCapacity - cargo;
  const suppliesDistribution = SUPPLY_IDS.filter((id) => state.fleet.supplies[id].quantity > 0)
    .map((id) => `${SUPPLY_LABELS[id]} ${state.fleet.supplies[id].quantity}`)
    .join(", ");
  const productsDistribution = products
    .map(([id, stack]) => `${getProduct(id)?.name ?? id} ${stack.quantity}`)
    .join(", ");

  return (
    <aside className={styles.rightSidebar} aria-label="Short-term status">
      <section className={styles.ledgerSection} aria-labelledby="cargo-details">
        <div className={styles.ledgerHeading}>
          <div>
            <p>Short-term ledger</p>
            <h2 id="cargo-details">Cargo Hold</h2>
          </div>
          <strong>
            {cargo} / {state.fleet.cargoCapacity}
          </strong>
        </div>
        <div
          className={styles.cargoCapacityBar}
          aria-label={`Cargo hold: ${suppliesCargo} Supply units, ${productsCargo} Product units, ${freeCargo} units free.`}
          role="img"
        >
          {suppliesCargo > 0 && <span data-cargo="supplies" style={{ flexGrow: suppliesCargo }} />}
          {productsCargo > 0 && <span data-cargo="products" style={{ flexGrow: productsCargo }} />}
          {freeCargo > 0 && <span data-cargo="free" style={{ flexGrow: freeCargo }} />}
        </div>
        <div className={styles.capacityLegend}>
          <span>
            <i data-cargo="supplies" aria-hidden="true" /> Supplies <strong>{suppliesCargo}</strong>
          </span>
          <span>
            <i data-cargo="products" aria-hidden="true" /> Products <strong>{productsCargo}</strong>
          </span>
          <span>
            <i data-cargo="free" aria-hidden="true" /> Free <strong>{freeCargo}</strong>
          </span>
        </div>
        <section className={styles.cargoGroup} aria-labelledby="supply-details">
          <div className={styles.cargoGroupHeading}>
            <div>
              <p>Voyage stores</p>
              <h3 id="supply-details">Supplies</h3>
            </div>
            <strong>{suppliesCargo} units</strong>
          </div>
          <div
            className={styles.cargoDistributionBar}
            aria-label={`Supply distribution: ${suppliesDistribution || "no Supplies held"}.`}
            role="img"
          >
            {SUPPLY_IDS.map((supplyId) => {
              const quantity = state.fleet.supplies[supplyId].quantity;
              return quantity > 0 ? <span key={supplyId} style={{ flexGrow: quantity }} /> : null;
            })}
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
        </section>
        <section className={styles.cargoGroup} aria-labelledby="product-details">
          <div className={styles.cargoGroupHeading}>
            <div>
              <p>Trade inventory</p>
              <h3 id="product-details">Products</h3>
            </div>
            <strong>{productsCargo} units</strong>
          </div>
          {products.length === 0 ? (
            <p className={styles.emptyState}>No Product Cargo is held.</p>
          ) : (
            <>
              <div
                className={styles.cargoDistributionBar}
                aria-label={`Product distribution: ${productsDistribution}.`}
                role="img"
              >
                {products.map(([productId, stack]) => (
                  <span key={productId} style={{ flexGrow: stack.quantity }} />
                ))}
              </div>
              <ul className={styles.cargoLedger}>
                {products.map(([productId, stack]) => {
                  const price = sellPrice(state, productId);
                  return (
                    <li key={productId}>
                      <div>
                        <strong>{getProduct(productId)?.name ?? productId}</strong>
                        <span>{stack.quantity} units</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Avg cost</dt>
                          <dd>{formatUnitGold(averageUnitCost(stack))}</dd>
                        </div>
                        <div>
                          <dt>Local sale</dt>
                          <dd>{formatUnitGold(price?.unitPrice ?? null)}</dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
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
