import type { CSSProperties } from "react";
import chartArtwork from "@/content/navigation/assets/nautical-chart-placeholder.svg";
import { NAV_EDGES, NAV_POINTS, PORTS, REGIONS, SUB_REGIONS } from "@/content/content-catalog";
import type { PassageEdgeSnapshot, PlannedPassageSnapshot } from "@/core/model/game";
import type { ChartPosition, NavEdge } from "@/core/content/world-content";
import styles from "../meridian-dashboard.module.css";

type NauticalChartProps = {
  currentPortId: string;
  selectedPortId: string;
  knownPortIds: readonly string[];
  passage: PlannedPassageSnapshot | null;
  onSelectPort(portId: string): void;
  showNavPointDestinations?: boolean;
  selectedNavPointId?: string | null;
  onSelectNavPoint?(navPointId: string): void;
};

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
type ChartArea = { id: string; name: string; bounds: Bounds };
type ChartPortStyle = CSSProperties & { "--chart-x": string; "--chart-y": string };

const NODE_POSITIONS = new Map<string, ChartPosition>([
  ...PORTS.map((port) => [port.id, port.chartPosition] as const),
  ...NAV_POINTS.map((point) => [point.id, point.chartPosition] as const),
]);
const NODE_SUB_REGION_IDS = new Map<string, string>([
  ...PORTS.map((port) => [port.id, port.subRegionId] as const),
  ...NAV_POINTS.map((point) => [point.id, point.subRegionId] as const),
]);

function boundsForPositions(positions: readonly ChartPosition[]): Bounds | null {
  if (positions.length === 0) {
    return null;
  }
  return {
    minX: Math.min(...positions.map((position) => position.x)),
    minY: Math.min(...positions.map((position) => position.y)),
    maxX: Math.max(...positions.map((position) => position.x)),
    maxY: Math.max(...positions.map((position) => position.y)),
  };
}

function paddedBounds(bounds: Bounds, padding: number): Bounds {
  return {
    minX: Math.max(0, bounds.minX - padding),
    minY: Math.max(0, bounds.minY - padding),
    maxX: Math.min(1000, bounds.maxX + padding),
    maxY: Math.min(1000, bounds.maxY + padding),
  };
}

function mergeBounds(bounds: readonly Bounds[]): Bounds | null {
  if (bounds.length === 0) {
    return null;
  }
  return {
    minX: Math.min(...bounds.map((entry) => entry.minX)),
    minY: Math.min(...bounds.map((entry) => entry.minY)),
    maxX: Math.max(...bounds.map((entry) => entry.maxX)),
    maxY: Math.max(...bounds.map((entry) => entry.maxY)),
  };
}

function edgeKey(edge: Pick<NavEdge, "originNodeId" | "destinationNodeId">): string {
  return [edge.originNodeId, edge.destinationNodeId].sort().join("::");
}

function isBerth(edge: Pick<NavEdge, "originNodeId" | "destinationNodeId">): boolean {
  return PORTS.some((port) => port.id === edge.originNodeId || port.id === edge.destinationNodeId);
}

function isSeaLane(edge: Pick<NavEdge, "originNodeId" | "destinationNodeId">): boolean {
  return !isBerth(edge);
}

const SUB_REGION_AREAS: ChartArea[] = SUB_REGIONS.flatMap((subRegion) => {
  const positions = [...NODE_SUB_REGION_IDS]
    .filter(([, subRegionId]) => subRegionId === subRegion.id)
    .map(([nodeId]) => NODE_POSITIONS.get(nodeId))
    .filter((position): position is ChartPosition => position !== undefined);
  const bounds = boundsForPositions(positions);
  return bounds ? [{ id: subRegion.id, name: subRegion.name, bounds: paddedBounds(bounds, 76) }] : [];
});
const REGION_AREAS: ChartArea[] = REGIONS.flatMap((region) => {
  const bounds = mergeBounds(
    SUB_REGIONS.filter((subRegion) => subRegion.regionId === region.id)
      .map((subRegion) => SUB_REGION_AREAS.find((area) => area.id === subRegion.id)?.bounds)
      .filter((entry): entry is Bounds => entry !== undefined),
  );
  return bounds ? [{ id: region.id, name: region.name, bounds: paddedBounds(bounds, 42) }] : [];
});
const SEA_LANES = NAV_EDGES.filter(
  (edge, index, edges) => edges.findIndex((candidate) => edgeKey(candidate) === edgeKey(edge)) === index,
);

function portStyle(position: ChartPosition): ChartPortStyle {
  return { "--chart-x": `${position.x / 10}%`, "--chart-y": `${position.y / 10}%` };
}

function edgeLine(edge: Pick<NavEdge, "originNodeId" | "destinationNodeId">) {
  const origin = NODE_POSITIONS.get(edge.originNodeId);
  const destination = NODE_POSITIONS.get(edge.destinationNodeId);
  return origin && destination ? { origin, destination } : null;
}

function selectedEdges(passage: PlannedPassageSnapshot | null): PassageEdgeSnapshot[] {
  return passage?.edges ?? [];
}

export function NauticalChart({
  currentPortId,
  selectedPortId,
  knownPortIds,
  passage,
  onSelectPort,
  showNavPointDestinations = true,
  selectedNavPointId = null,
  onSelectNavPoint,
}: NauticalChartProps) {
  const knownPorts = PORTS.filter((port) => knownPortIds.includes(port.id));
  const routeEdges = selectedEdges(passage);

  return (
    <section className={styles.nauticalChart} aria-labelledby="nautical-chart-heading">
      <div className={styles.nauticalChartHeading}>
        <div>
          <p>Charted waters</p>
          <h4 id="nautical-chart-heading">Nautical Chart</h4>
        </div>
        <span>Port and holding markers are selectable</span>
      </div>
      <div className={styles.chartViewport}>
        <div className={styles.chartMapSurface}>
          <svg className={styles.chartArtwork} viewBox="0 0 1000 1000" aria-hidden="true" preserveAspectRatio="none">
            <image href={chartArtwork} width="1000" height="1000" />
            {REGION_AREAS.map((region) => (
              <g key={region.id} className={styles.chartRegion}>
                <rect
                  x={region.bounds.minX}
                  y={region.bounds.minY}
                  width={region.bounds.maxX - region.bounds.minX}
                  height={region.bounds.maxY - region.bounds.minY}
                  rx="38"
                />
                <text x={region.bounds.minX + 24} y={region.bounds.minY + 34}>
                  {region.name}
                </text>
              </g>
            ))}
            {SUB_REGION_AREAS.map((subRegion) => (
              <g key={subRegion.id} className={styles.chartSubRegion}>
                <rect
                  x={subRegion.bounds.minX}
                  y={subRegion.bounds.minY}
                  width={subRegion.bounds.maxX - subRegion.bounds.minX}
                  height={subRegion.bounds.maxY - subRegion.bounds.minY}
                  rx="28"
                />
                <text x={subRegion.bounds.minX + 17} y={subRegion.bounds.minY + 25}>
                  {subRegion.name}
                </text>
              </g>
            ))}
            {SEA_LANES.map((edge) => {
              const line = edgeLine(edge);
              if (!line) {
                return null;
              }
              return (
                <line
                  className={isSeaLane(edge) ? styles.chartSeaLane : styles.chartBerthLane}
                  key={edgeKey(edge)}
                  x1={line.origin.x}
                  y1={line.origin.y}
                  x2={line.destination.x}
                  y2={line.destination.y}
                />
              );
            })}
            {routeEdges.map((edge) => {
              const line = edgeLine(edge);
              if (!line) {
                return null;
              }
              return (
                <line
                  className={styles.chartSelectedLane}
                  key={edge.id}
                  x1={line.origin.x}
                  y1={line.origin.y}
                  x2={line.destination.x}
                  y2={line.destination.y}
                />
              );
            })}
          </svg>
        </div>
        <ul className={styles.chartPortControls} aria-label="Known ports and holding positions">
          {knownPorts.map((port) => {
            const isCurrent = port.id === currentPortId;
            const isSelected = port.id === selectedPortId;
            return (
              <li key={port.id} style={portStyle(port.chartPosition)}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  data-current-port={isCurrent ? "true" : undefined}
                  onClick={() => onSelectPort(port.id)}
                  aria-label={`${port.name}${isCurrent ? ", current berth" : ", select destination"}${
                    isSelected ? ", selected" : ""
                  }`}
                >
                  <span aria-hidden="true">{isCurrent ? "◆" : "●"}</span>
                  <strong>{port.name}</strong>
                  <small>{isCurrent ? "Current berth" : "Known Port"}</small>
                </button>
              </li>
            );
          })}
          {showNavPointDestinations &&
            NAV_POINTS.filter((point) => point.isChartDestination).map((point) => (
              <li key={point.id} style={portStyle(point.chartPosition)}>
                <button
                  type="button"
                  aria-pressed={selectedNavPointId === point.id}
                  onClick={() => onSelectNavPoint?.(point.id)}
                  aria-label={`${point.name}, holding position${selectedNavPointId === point.id ? ", selected" : ""}`}
                >
                  <span aria-hidden="true">◇</span>
                  <strong>{point.name}</strong>
                  <small>Holding position</small>
                </button>
              </li>
            ))}
        </ul>
      </div>
      <p className={styles.chartLegend}>
        <span>
          <i className={styles.chartLegendCurrent} aria-hidden="true" /> Current berth
        </span>
        <span>
          <i className={styles.chartLegendRoute} aria-hidden="true" /> Selected passage
        </span>
        <span>
          <i className={styles.chartLegendBerth} aria-hidden="true" /> Harbor berth link
        </span>
      </p>
    </section>
  );
}
