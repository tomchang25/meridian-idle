import { getPort } from "@/content/content-catalog";
import { displayName, formatRemaining } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";

type HarborPanelProps = {
  store: DashboardStore;
};

export function HarborPanel({ store }: HarborPanelProps) {
  const { state } = store;
  const port = getPort(state.fleet.locationPortId);
  const destinations = state.world.knownPortIds.filter((portId) => portId !== state.fleet.locationPortId);

  return (
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
        {destinations.map((destinationPortId) => {
          const routeDestination = getPort(destinationPortId);
          const preview = store.previewVoyage(destinationPortId);
          const passage = preview.passage;
          const unavailableReason = !store.canGenerateVoyageSeed ? "Secure randomness is unavailable." : preview.error;
          const departureReasonId = `depart-${destinationPortId}-reason`;
          const readiness = preview.readiness;
          return (
            <li key={destinationPortId}>
              <div className={styles.routeCompass} aria-hidden="true">
                {passage?.totalDistance ?? "—"}
              </div>
              <div className={styles.routeIdentity}>
                <span>{displayName(routeDestination?.regionId ?? "unknown waters")}</span>
                <strong>{routeDestination?.name ?? "Unknown Port"}</strong>
                <p>
                  {passage ? `${passage.totalDistance} distance units across a charted passage.` : "No legal passage."}
                </p>
              </div>
              <dl>
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {preview.scheduledDurationMilliseconds
                      ? formatRemaining(preview.scheduledDurationMilliseconds)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>{passage ? `${Math.round(passage.staticRisk * 100)}%` : "—"}</dd>
                </div>
                <div>
                  <dt>Supplies</dt>
                  <dd>
                    Food {readiness?.food.required ?? "—"} required / {readiness?.food.aboard ?? "—"} aboard
                    {readiness?.food.missing ? ` / Missing ${readiness.food.missing}` : " / Ready"}
                    <br />
                    Water {readiness?.water.required ?? "—"} required / {readiness?.water.aboard ?? "—"} aboard
                    {readiness?.water.missing ? ` / Missing ${readiness.water.missing}` : " / Ready"}
                  </dd>
                </div>
              </dl>
              <div className={styles.harborRouteActions}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={unavailableReason !== null}
                  aria-describedby={unavailableReason ? departureReasonId : undefined}
                  onClick={() => preview.quoteId && store.departVoyage(destinationPortId, preview.quoteId)}
                >
                  Depart for {routeDestination?.name ?? "destination"}
                </button>
              </div>
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
  );
}
