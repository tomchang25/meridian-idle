import { getPort, ROUTES } from "@/game/domain/content/core-content";
import { voyageDepartureError, voyageSupplyReadiness } from "@/game/domain/rules/voyage";
import { displayName, formatRemaining } from "../dashboard-helpers";
import type { DashboardStore } from "../dashboard-types";
import styles from "../meridian-dashboard.module.css";

type HarborPanelProps = {
  store: DashboardStore;
};

export function HarborPanel({ store }: HarborPanelProps) {
  const { state } = store;
  const port = getPort(state.fleet.locationPortId);
  const routes = ROUTES.filter((route) => route.originPortId === state.fleet.locationPortId);

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
        {routes.map((route) => {
          const routeDestination = getPort(route.destinationPortId);
          const departureError = voyageDepartureError(state, route.id);
          const unavailableReason = !store.canGenerateVoyageSeed ? "Secure randomness is unavailable." : departureError;
          const departureReasonId = `depart-${route.id}-reason`;
          const readiness = voyageSupplyReadiness(state, route.id);
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
                    Food {readiness?.food.required} required / {readiness?.food.aboard} aboard
                    {readiness?.food.missing ? ` / Missing ${readiness.food.missing}` : " / Ready"}
                    <br />
                    Water {readiness?.water.required} required / {readiness?.water.aboard} aboard
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
                  onClick={() => store.departVoyage(route.id)}
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
