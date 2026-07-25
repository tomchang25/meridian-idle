import { useState } from "react";
import { getNavPoint, getPort, getSubRegion } from "@/content/content-catalog";
import { formatRemaining } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";
import { NauticalChart } from "../city-actions/nautical-chart";

type NavPointHoldPanelProps = { store: DashboardStore };

export function NavPointHoldPanel({ store }: NavPointHoldPanelProps) {
  const { state } = store;
  const navPointId = state.fleet.holdingNavPointId;
  const [view, setView] = useState<"holding" | "destination">("holding");
  const [destinationPortId, setDestinationPortId] = useState(state.world.knownPortIds[0] ?? "");
  const point = getNavPoint(navPointId ?? "");
  const origin = getPort(state.fleet.holdingOriginNodeId ?? "") ?? getNavPoint(state.fleet.holdingOriginNodeId ?? "");
  const preview = destinationPortId ? store.previewVoyage(destinationPortId) : null;
  const destination = getPort(destinationPortId);
  const passage = preview?.passage ?? null;
  const unavailableReason = !store.canGenerateVoyageSeed
    ? "Secure randomness is unavailable."
    : (preview?.error ?? (passage ? null : "A current Passage quote is unavailable."));
  const waters = [...new Set(passage?.edges.flatMap((edge) => edge.spans.map((span) => span.subRegionId)) ?? [])]
    .map((subRegionId) => getSubRegion(subRegionId)?.name ?? subRegionId)
    .join(" → ");

  return (
    <section className={styles.actionPanel} aria-labelledby="holding-position-title">
      <div className={styles.voyageHeader}>
        <div>
          <p>Holding position</p>
          <h2 id="holding-position-title">{point?.name ?? "Unknown Navigation Point"}</h2>
        </div>
        {view === "holding" ? (
          <span className={styles.voyageBadge}>Orders required</span>
        ) : (
          <button className={styles.secondaryButton} type="button" onClick={() => setView("holding")}>
            ← Back to holding position
          </button>
        )}
      </div>
      <p className={styles.routeTrack}>
        <span>✓ {origin?.name ?? "Completed origin"}</span>
        <i />
        <span>● {point?.name ?? "Current point"}</span>
        <i />
        <span>◇ Orders required</span>
      </p>
      {view === "holding" ? (
        <div className={styles.holdingPositionSummary}>
          <div className={styles.holdingPositionSeal} aria-hidden="true">
            ⚓
          </div>
          <div>
            <p>Safe anchorage</p>
            <h3>Awaiting your next order</h3>
            <span>No sailing time, Supplies, or Events advance while holding position.</span>
          </div>
          <dl>
            <div>
              <dt>Clock</dt>
              <dd>Paused</dd>
            </div>
            <div>
              <dt>Supplies</dt>
              <dd>Secured</dd>
            </div>
          </dl>
          <button className={styles.primaryButton} type="button" onClick={() => setView("destination")}>
            Choose sailing target
          </button>
        </div>
      ) : (
        <div className={styles.holdingDestinationPicker}>
          <p className={styles.workspaceIntro}>
            Select a known Port on the chart. Returning here does not spend Supplies until you set sail.
          </p>
          <NauticalChart
            currentPortId=""
            selectedPortId={destinationPortId}
            knownPortIds={state.world.knownPortIds}
            passage={passage}
            onSelectPort={setDestinationPortId}
            showNavPointDestinations={false}
          />
          <section className={styles.holdingPassagePreview} aria-labelledby="holding-passage-preview">
            <div>
              <p>Selected sailing target</p>
              <h3 id="holding-passage-preview">{destination?.name ?? "Choose a Port"}</h3>
            </div>
            {passage ? (
              <dl>
                <div>
                  <dt>Distance</dt>
                  <dd>{passage.totalDistance} units</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {preview?.scheduledDurationMilliseconds
                      ? formatRemaining(preview.scheduledDurationMilliseconds)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>{Math.round(passage.staticRisk * 100)}%</dd>
                </div>
                <div>
                  <dt>Supplies</dt>
                  <dd>
                    Food {preview?.readiness?.food.required ?? "—"} · Water {preview?.readiness?.water.required ?? "—"}
                  </dd>
                </div>
                <div className={styles.holdingWaters}>
                  <dt>Waters</dt>
                  <dd>{waters || "Unknown waters"}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.unavailableReason}>{unavailableReason}</p>
            )}
            <button
              className={styles.primaryButton}
              type="button"
              disabled={!preview?.quoteId || unavailableReason !== null}
              onClick={() => preview?.quoteId && store.departVoyage(destinationPortId, preview.quoteId)}
            >
              Set Sail for {destination?.name ?? "selected Port"}
            </button>
            {passage && unavailableReason && <p className={styles.unavailableReason}>{unavailableReason}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
