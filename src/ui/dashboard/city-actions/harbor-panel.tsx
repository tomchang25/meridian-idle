import { useState } from "react";
import { getNavPoint, getPort, getRegion, getSubRegion, PRODUCTS } from "@/content/content-catalog";
import { portLevel } from "@/core/rules/progression";
import { displayName, formatRemaining } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";
import { NauticalChart } from "./nautical-chart";

type HarborPanelProps = {
  store: DashboardStore;
};

function traversedWaters(subRegionIds: readonly string[]): string[] {
  const seen = new Set<string>();
  return subRegionIds.flatMap((subRegionId) => {
    if (seen.has(subRegionId)) {
      return [];
    }
    seen.add(subRegionId);
    return [getSubRegion(subRegionId)?.name ?? displayName(subRegionId)];
  });
}

export function HarborPanel({ store }: HarborPanelProps) {
  const { state } = store;
  const currentPortId = state.fleet.locationPortId;
  const [selectedPortId, setSelectedPortId] = useState(currentPortId);
  const selectedPort = getPort(selectedPortId);
  const selectedNavPoint = getNavPoint(selectedPortId);
  const currentPort = getPort(currentPortId);
  const isCurrentPort = selectedPortId === currentPortId;
  const preview = isCurrentPort ? null : store.previewVoyage(selectedPortId);
  const passage = preview?.passage ?? null;
  const readiness = preview?.readiness ?? null;
  const specialty = PRODUCTS.find((product) => product.specialtyOriginPortId === selectedPortId);
  const specialtyEntry = selectedPort?.catalog.find((entry) => entry.productId === specialty?.id);
  const unavailableReason = isCurrentPort
    ? "Select another known Port to review a Passage."
    : !store.canGenerateVoyageSeed
      ? "Secure randomness is unavailable."
      : preview
        ? preview.error
        : "A current Passage quote is unavailable.";
  const departureReasonId = "harbor-departure-reason";
  const waters = traversedWaters(passage?.edges.flatMap((edge) => edge.spans.map((span) => span.subRegionId)) ?? []);

  return (
    <section aria-labelledby="harbor-command">
      <div className={styles.workspaceHeading}>
        <div>
          <p>Departure chart</p>
          <h3 id="harbor-command">Choose a destination</h3>
        </div>
        <div className={styles.marketPulse}>
          <span>Current berth</span>
          <strong>{currentPort?.name ?? "Unknown Port"}</strong>
        </div>
      </div>
      <p className={styles.workspaceIntro}>
        Inspect a charted Port before setting sail. Departure commits the listed Food and Water.
      </p>
      <NauticalChart
        currentPortId={currentPortId}
        selectedPortId={selectedPortId}
        knownPortIds={state.world.knownPortIds}
        passage={passage}
        onSelectPort={setSelectedPortId}
        selectedNavPointId={selectedNavPoint?.id ?? null}
        onSelectNavPoint={setSelectedPortId}
      />
      <div className={styles.harborDetailGrid}>
        <section className={styles.harborDetailPanel} aria-labelledby="selected-port-heading">
          <p>Selected Port</p>
          <h4 id="selected-port-heading">{selectedPort?.name ?? selectedNavPoint?.name ?? "Unknown destination"}</h4>
          <dl className={styles.harborFacts}>
            <div>
              <dt>Region</dt>
              <dd>
                {getRegion(selectedPort?.regionId ?? getSubRegion(selectedNavPoint?.subRegionId ?? "")?.regionId ?? "")
                  ?.name ?? "Unknown waters"}
              </dd>
            </div>
            <div>
              <dt>SubRegion</dt>
              <dd>
                {getSubRegion(selectedPort?.subRegionId ?? selectedNavPoint?.subRegionId ?? "")?.name ??
                  "Unknown waters"}
              </dd>
            </div>
            <div>
              <dt>Port Level</dt>
              <dd>Level {portLevel(state, selectedPortId)}</dd>
            </div>
            <div>
              <dt>Specialty</dt>
              <dd>
                {specialty
                  ? `${specialty.name} · Level ${specialtyEntry?.unlockLevel ?? "?"}`
                  : "No specialty recorded"}
              </dd>
            </div>
          </dl>
          <p className={styles.harborMarketStatus}>
            {isCurrentPort
              ? "Current Market Session is available at this berth."
              : selectedNavPoint
                ? "Holding position does not open a Market Session."
                : "Market prices are available after docking."}
          </p>
        </section>
        <section className={styles.harborDetailPanel} aria-labelledby="passage-preview-heading">
          <p>Selected Passage</p>
          <h4 id="passage-preview-heading">{isCurrentPort ? "Select a remote Port" : "Passage preview"}</h4>
          {passage ? (
            <>
              <dl className={styles.harborFacts}>
                <div>
                  <dt>Distance</dt>
                  <dd>{passage.totalDistance} distance units</dd>
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
                  <dt>Waters</dt>
                  <dd>{waters.join(" → ") || "Unknown waters"}</dd>
                </div>
              </dl>
              <dl className={styles.harborSupplyFacts}>
                <div>
                  <dt>Food</dt>
                  <dd>
                    {readiness?.food.required ?? "—"} required / {readiness?.food.aboard ?? "—"} aboard
                    {readiness?.food.missing ? ` / Missing ${readiness.food.missing}` : " / Ready"}
                  </dd>
                </div>
                <div>
                  <dt>Water</dt>
                  <dd>
                    {readiness?.water.required ?? "—"} required / {readiness?.water.aboard ?? "—"} aboard
                    {readiness?.water.missing ? ` / Missing ${readiness.water.missing}` : " / Ready"}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className={styles.harborEmptyState}>{unavailableReason}</p>
          )}
          <div className={styles.harborRouteActions}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={unavailableReason !== null}
              aria-describedby={departureReasonId}
              onClick={() => preview?.quoteId && store.departVoyage(selectedPortId, preview.quoteId)}
            >
              Set Sail for {selectedPort?.name ?? selectedNavPoint?.name ?? "destination"}
            </button>
            <p className={styles.unavailableReason} id={departureReasonId}>
              {unavailableReason}
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
