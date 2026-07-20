import type { DashboardStore } from "./dashboard-types";
import styles from "./meridian-dashboard.module.css";

type DashboardFeedbackProps = {
  store: DashboardStore;
};

export function DashboardFeedback({ store }: DashboardFeedbackProps) {
  const { commandError, state } = store;
  const showMigration = state.migrationReport && !state.migrationReport.acknowledged;

  if (!commandError && !showMigration) return null;

  return (
    <div className={styles.feedbackStack}>
      {commandError && (
        <section className={styles.alertPanel} aria-labelledby="command-error-title">
          <p>Command issue</p>
          <h2 id="command-error-title">Order could not be completed</h2>
          <span role="alert">Command failed: {commandError}</span>
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
  );
}
