import { getPort, getSubRegion } from "@/content/content-catalog";
import type { Voyage } from "@/core/model/game";
import { resolvedVoyageSubRegionId } from "@/core/rules/voyage";
import type { Clock } from "@/runtime/clock";
import { formatRemaining } from "../dashboard-helpers";
import styles from "../meridian-dashboard.module.css";
import { useVoyageClock } from "./use-voyage-clock";

type VoyageStatusPanelProps = {
  voyage: Voyage;
  clock: Clock;
};

export function VoyageStatusPanel({ voyage, clock }: VoyageStatusPanelProps) {
  const displayNow = useVoyageClock(voyage, clock);
  const destinationPort = getPort(voyage.passage.destinationPortId);
  const voyageDuration = Math.max(1, voyage.plannedArrivesAt - voyage.departedAt);
  const voyageElapsed = Math.min(voyageDuration, Math.max(0, (displayNow || voyage.departedAt) - voyage.departedAt));
  const voyageProgress = Math.floor((voyageElapsed / voyageDuration) * 100);
  const voyageRemaining = voyageDuration - voyageElapsed;
  const resolvedSubRegionId = resolvedVoyageSubRegionId(voyage);
  const resolvedWaters = getSubRegion(resolvedSubRegionId ?? "")?.name ?? "Open waters";
  const consumedSupplies = voyage.progress.supplyLedger.consumedSupplies;

  return (
    <section className={styles.actionPanel} aria-labelledby="action-panel-title">
      <div className={styles.voyageStatus}>
        <div className={styles.voyageHeader}>
          <div>
            <p>Voyage in progress</p>
            <h2 id="action-panel-title">
              {getPort(voyage.passage.originPortId)?.name ?? "Unknown Port"} to{" "}
              {destinationPort?.name ?? "Unknown Port"}
            </h2>
          </div>
          <span className={styles.voyageBadge}>Risk {Math.round(voyage.passage.staticRisk * 100)}%</span>
        </div>
        <div className={styles.routeTrack} aria-hidden="true">
          <span>{getPort(voyage.passage.originPortId)?.name ?? "Origin"}</span>
          <i />
          <b>{voyageProgress}%</b>
          <i />
          <span>{destinationPort?.name ?? "Destination"}</span>
        </div>
        <progress className={styles.voyageProgress} aria-label="Voyage progress" max="100" value={voyageProgress}>
          {voyageProgress}%
        </progress>
        <dl className={styles.voyageFacts}>
          <div>
            <dt>Remaining</dt>
            <dd>{formatRemaining(voyageRemaining)}</dd>
          </div>
          <div>
            <dt>Consumed</dt>
            <dd>
              Food {consumedSupplies.food} / {voyage.passage.requiredSupplies.food} · Water {consumedSupplies.water} /{" "}
              {voyage.passage.requiredSupplies.water}
            </dd>
          </div>
          <div>
            <dt>Resolved waters</dt>
            <dd>{resolvedWaters}</dd>
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
    </section>
  );
}
