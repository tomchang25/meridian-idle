import { DEBUG_TOOLS } from "@/app/debug/debug-tools";
import styles from "./debug-hub.module.css";

/** The `/debug` index. Lists every registered dev tool with a link. */
export function DebugHub() {
  return (
    <main className={styles.hub}>
      <h1>Meridian debug tools</h1>
      <ul className={styles.list}>
        {DEBUG_TOOLS.map((tool) => (
          <li key={tool.id} className={styles.item}>
            <a href={tool.path}>{tool.title}</a>
            <p>{tool.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
