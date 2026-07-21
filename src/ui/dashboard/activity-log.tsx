import { getPort } from "@/content/catalog";
import type { V5GameState } from "@/core/model/game";
import { displayName } from "./dashboard-helpers";
import styles from "./meridian-dashboard.module.css";

type ActivityLogProps = {
  state: V5GameState;
};

export function ActivityLog({ state }: ActivityLogProps) {
  return (
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
  );
}
