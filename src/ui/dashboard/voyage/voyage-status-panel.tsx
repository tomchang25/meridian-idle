import { getNavPoint, getPort, getSubRegion } from "@/content/content-catalog";
import type { Voyage } from "@/core/model/game";
import type { BreakOffExitId, BreakOffExitOption } from "@/core/rules/voyage";
import { resolvedVoyageSubRegionId } from "@/core/rules/voyage";
import type { DashboardStore } from "../dashboard-types";
import { formatRemaining } from "../dashboard-helpers";
import styles from "../meridian-dashboard.module.css";
import { useVoyageClock } from "./use-voyage-clock";

type VoyageStatusPanelProps = {
  voyage: Voyage;
  store: DashboardStore;
};

function nodeName(nodeId: string): string {
  return getPort(nodeId)?.name ?? getNavPoint(nodeId)?.name ?? nodeId;
}

function BreakOffExitCard({
  option,
  onBreakOff,
}: {
  option: BreakOffExitOption;
  onBreakOff: (exit: BreakOffExitId, quoteId: string) => void;
}) {
  return (
    <div className={`${styles.holdingPositionSummary} ${styles.breakOffExit}`}>
      <div>
        <p>{option.exit === "prior" ? "Return to" : "Continue to"}</p>
        <h3>{nodeName(option.nodeId)}</h3>
        {option.passage && (
          <span>
            {formatRemaining(option.scheduledDurationMilliseconds ?? 0)} · Risk{" "}
            {Math.round(option.passage.staticRisk * 100)}% · Food {option.readiness?.food.required ?? "—"} · Water{" "}
            {option.readiness?.water.required ?? "—"}
          </span>
        )}
      </div>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={!option.quoteId || option.error !== null}
        onClick={() => option.quoteId && onBreakOff(option.exit, option.quoteId)}
      >
        Break off {option.exit === "prior" ? "back" : "onward"}
      </button>
      {option.error && <p className={styles.unavailableReason}>{option.error}</p>}
    </div>
  );
}

export function VoyageStatusPanel({ voyage, store }: VoyageStatusPanelProps) {
  const displayNow = useVoyageClock(voyage, store.clock);
  const destinationNode = getPort(voyage.passage.destinationPortId) ?? getNavPoint(voyage.passage.destinationPortId);
  const originNode = getPort(voyage.passage.originPortId) ?? getNavPoint(voyage.passage.originPortId);
  const originLabel =
    voyage.passage.kind === "planned" && voyage.passage.departedMidEdge
      ? "Open Water"
      : (originNode?.name ?? "Unknown origin");
  const voyageDuration = Math.max(1, voyage.plannedArrivesAt - voyage.departedAt);
  const voyageElapsed = Math.min(voyageDuration, Math.max(0, (displayNow || voyage.departedAt) - voyage.departedAt));
  const voyageProgress = Math.floor((voyageElapsed / voyageDuration) * 100);
  const voyageRemaining = voyageDuration - voyageElapsed;
  const resolvedSubRegionId = resolvedVoyageSubRegionId(voyage);
  const resolvedWaters = getSubRegion(resolvedSubRegionId ?? "")?.name ?? "Open waters";
  const consumedSupplies = voyage.progress.supplyLedger.consumedSupplies;
  const currentEdge =
    voyage.passage.kind === "planned" && voyage.progress.kind === "planned"
      ? voyage.passage.edges[Math.min(voyage.passage.edges.length - 1, voyage.progress.completedEdgeCount)]
      : undefined;
  const nextWaypointId = currentEdge?.destinationNodeId ?? "";
  const nextWaypoint = getPort(nextWaypointId) ?? getNavPoint(nextWaypointId);
  const breakOffPreview = store.previewBreakOff();

  return (
    <section className={styles.actionPanel} aria-labelledby="action-panel-title">
      <div className={styles.voyageStatus}>
        <div className={styles.voyageHeader}>
          <div>
            <p>Voyage in progress</p>
            <h2 id="action-panel-title">
              {originLabel} to {destinationNode?.name ?? "Unknown destination"}
            </h2>
          </div>
          <span className={styles.voyageBadge}>Risk {Math.round(voyage.passage.staticRisk * 100)}%</span>
        </div>
        <div className={styles.routeTrack} aria-hidden="true">
          <span>{originLabel}</span>
          <i />
          <b>{voyageProgress}%</b>
          <i />
          <span>{destinationNode?.name ?? "Destination"}</span>
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
          {voyage.passage.kind === "planned" && voyage.progress.kind === "planned" && (
            <>
              <div>
                <dt>Current leg</dt>
                <dd>
                  {Math.min(voyage.passage.edges.length, voyage.progress.completedEdgeCount + 1)} of{" "}
                  {voyage.passage.edges.length} ·{" "}
                  {Math.max(0, voyage.passage.edges.length - voyage.progress.completedEdgeCount)} edges remaining
                </dd>
              </div>
              <div>
                <dt>Next waypoint</dt>
                <dd>{nextWaypoint?.name ?? "Unknown waypoint"}</dd>
              </div>
            </>
          )}
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
        {breakOffPreview.kind === "mid-edge" && (
          <section className={styles.breakOffPanel} aria-labelledby="break-off-title">
            <p id="break-off-title" className={styles.workspaceIntro}>
              Break off now: the Fleet holds at the nearer node instead of completing this Passage.
            </p>
            <BreakOffExitCard
              option={breakOffPreview.prior}
              onBreakOff={(exit, quoteId) => store.breakOffVoyage(exit, quoteId)}
            />
            <BreakOffExitCard
              option={breakOffPreview.next}
              onBreakOff={(exit, quoteId) => store.breakOffVoyage(exit, quoteId)}
            />
          </section>
        )}
        {breakOffPreview.kind === "at-node" && (
          <section className={styles.breakOffPanel} aria-labelledby="break-off-title">
            <p id="break-off-title" className={styles.workspaceIntro}>
              The Fleet is passing {nodeName(breakOffPreview.nodeId)} right now.
            </p>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => store.breakOffAtNode(breakOffPreview.quoteId)}
            >
              Hold at {nodeName(breakOffPreview.nodeId)}
            </button>
          </section>
        )}
      </div>
    </section>
  );
}
