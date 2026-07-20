import { getPort } from "@/content/core-content";
import type { V5GameState } from "@/core/models/game";
import { displayName } from "../dashboard-helpers";
import styles from "../meridian-dashboard.module.css";

type PortScenePanelProps = {
  state: V5GameState;
};

export function PortScenePanel({ state }: PortScenePanelProps) {
  const { voyage } = state;
  const port = getPort(state.fleet.locationPortId);
  const destinationPort = voyage ? getPort(voyage.destinationPortId) : undefined;
  const regionName = displayName(port?.regionId ?? "unknown waters");

  return (
    <section className={styles.scenePanel} aria-labelledby="scene-title">
      <div className={styles.sceneCopy}>
        <p>
          {voyage
            ? `${displayName(getPort(voyage.originPortId)?.regionId ?? "open water")} / Open Water`
            : `${regionName} / ${port?.name ?? "Unknown Port"}`}
        </p>
        <h2 id="scene-title">
          {voyage
            ? `Underway to ${destinationPort?.name ?? "Unknown Port"}`
            : `Port operations at ${port?.name ?? "Unknown Port"}`}
        </h2>
        <div className={styles.sceneTags}>
          <span>{voyage ? "Underway" : "Docked"}</span>
          {voyage ? <span>Static risk {Math.round(voyage.staticRisk * 100)}%</span> : <span>Market open</span>}
        </div>
      </div>

      <div className={styles.pixelScene} aria-hidden="true">
        <div className={styles.pixelSun} />
        <div className={`${styles.pixelCloud} ${styles.cloudOne}`} />
        <div className={`${styles.pixelCloud} ${styles.cloudTwo}`} />
        <div className={styles.farHills} />

        {!voyage ? (
          <>
            <div className={`${styles.pixelBuilding} ${styles.buildingOne}`} />
            <div className={`${styles.pixelBuilding} ${styles.buildingTwo}`} />
            <div className={`${styles.pixelBuilding} ${styles.buildingThree}`} />
            <div className={styles.harborTower} />
            <div className={styles.harborWall} />
            <div className={styles.dockCrane} />
            <div className={`${styles.pixelShip} ${styles.dockedShip}`}>
              <span className={styles.shipMast} />
              <span className={styles.shipSail} />
              <span className={styles.shipFlag} />
              <span className={styles.shipHull} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.distantCoast} />
            <div className={`${styles.pixelShip} ${styles.voyageShip}`}>
              <span className={styles.shipMast} />
              <span className={styles.shipSail} />
              <span className={styles.shipFlag} />
              <span className={styles.shipHull} />
            </div>
          </>
        )}

        <div className={styles.pixelWater}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className={styles.sceneFrame} aria-hidden="true" />
    </section>
  );
}
