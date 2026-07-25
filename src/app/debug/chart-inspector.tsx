import { useMemo, useState } from "react";
import {
  NAV_EDGES,
  NAVIGATION_CONSTANTS,
  NAV_POINTS,
  PORTS,
  PRODUCT_FAMILIES,
  PRODUCTS,
  REGIONS,
  ROUTES,
  STARTING_PORT_ID,
  SUB_REGIONS,
  SUPPLY_PRICES,
  WORLD_CONTENT,
} from "@/content/content-catalog";
import { validateCatalog, type ContentCatalog } from "@/content/catalog-validation";
import type { ChartPosition, NavEdge } from "@/core/content/world-content";
import { estimatePassage, planPassage } from "@/core/navigation/passage-planner";
import styles from "./chart-inspector.module.css";

const KNOWN_PORT_IDS = PORTS.map((port) => port.id);
const EDGE_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  "lisbon-cape-outbound": { x: 76, y: 0 },
  "cape-faro-outbound": { x: 0, y: -52 },
  "faro-tangier-outbound": { x: 18, y: -50 },
};
const SUB_REGION_PADDING = { x: 64, y: 58 };
const REGION_PADDING = { x: 30, y: 34 };

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

const catalog: ContentCatalog = {
  productFamilies: PRODUCT_FAMILIES,
  products: PRODUCTS,
  ports: PORTS,
  routes: ROUTES,
  regions: REGIONS,
  subRegions: SUB_REGIONS,
  navPoints: NAV_POINTS,
  navEdges: NAV_EDGES,
  navigationConstants: NAVIGATION_CONSTANTS,
  supplyPrices: SUPPLY_PRICES,
  startingPortId: STARTING_PORT_ID,
};

function nodePosition(id: string) {
  return WORLD_CONTENT.getPort(id)?.chartPosition ?? WORLD_CONTENT.getNavPoint(id)?.chartPosition;
}

function nodeSubRegionId(id: string): string | undefined {
  return WORLD_CONTENT.getPort(id)?.subRegionId ?? WORLD_CONTENT.getNavPoint(id)?.subRegionId;
}

function boundsForPositions(positions: readonly ChartPosition[]): Bounds | undefined {
  if (positions.length === 0) return undefined;
  return {
    minX: Math.min(...positions.map((position) => position.x)),
    minY: Math.min(...positions.map((position) => position.y)),
    maxX: Math.max(...positions.map((position) => position.x)),
    maxY: Math.max(...positions.map((position) => position.y)),
  };
}

function mergeBounds(bounds: readonly Bounds[]): Bounds | undefined {
  if (bounds.length === 0) return undefined;
  return {
    minX: Math.min(...bounds.map((entry) => entry.minX)),
    minY: Math.min(...bounds.map((entry) => entry.minY)),
    maxX: Math.max(...bounds.map((entry) => entry.maxX)),
    maxY: Math.max(...bounds.map((entry) => entry.maxY)),
  };
}

function padBounds(bounds: Bounds, padding: { x: number; y: number }): Bounds {
  return {
    minX: bounds.minX - padding.x,
    minY: bounds.minY - padding.y,
    maxX: bounds.maxX + padding.x,
    maxY: bounds.maxY + padding.y,
  };
}

function colorForSubRegion(id: string): string {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 62% 43%)`;
}

function primarySubRegionId(edge: NavEdge): string | undefined {
  const longestDistance = Math.max(...edge.spans.map((span) => span.distance));
  const longestSpans = edge.spans.filter((span) => span.distance === longestDistance);
  const originSubRegionId = nodeSubRegionId(edge.originNodeId);
  return (
    longestSpans.find((span) => span.subRegionId === originSubRegionId)?.subRegionId ??
    [...longestSpans].sort((left, right) => left.subRegionId.localeCompare(right.subRegionId))[0]?.subRegionId
  );
}

const NODE_ENTRIES = [...PORTS, ...NAV_POINTS];
const SUB_REGION_LAYOUTS = SUB_REGIONS.flatMap((subRegion) => {
  const positions = NODE_ENTRIES.filter((node) => node.subRegionId === subRegion.id).map((node) => node.chartPosition);
  const bounds = boundsForPositions(positions);
  return bounds
    ? [{ ...subRegion, bounds: padBounds(bounds, SUB_REGION_PADDING), color: colorForSubRegion(subRegion.id) }]
    : [];
});
const REGION_LAYOUTS = REGIONS.flatMap((region) => {
  const bounds = mergeBounds(
    SUB_REGION_LAYOUTS.filter((subRegion) => subRegion.regionId === region.id).map((subRegion) => subRegion.bounds),
  );
  return bounds ? [{ ...region, bounds: padBounds(bounds, REGION_PADDING) }] : [];
});
const CHART_BOUNDS = padBounds(
  mergeBounds(REGION_LAYOUTS.map((region) => region.bounds)) ??
    boundsForPositions(NODE_ENTRIES.map((node) => node.chartPosition))!,
  { x: 20, y: 20 },
);
const CHART_VIEW_BOX = `${CHART_BOUNDS.minX} ${CHART_BOUNDS.minY} ${CHART_BOUNDS.maxX - CHART_BOUNDS.minX} ${
  CHART_BOUNDS.maxY - CHART_BOUNDS.minY
}`;

function quoteFor(originPortId: string, destinationPortId: string) {
  const plan = planPassage({
    world: WORLD_CONTENT,
    originPortId,
    destinationPortId,
    knownPortIds: KNOWN_PORT_IDS,
    speed: 100,
  });
  return plan.kind === "planned" ? estimatePassage(plan, WORLD_CONTENT, 100) : plan;
}

function seconds(milliseconds: number): string {
  return `${milliseconds / 1_000}s`;
}

function edgePairKey(originNodeId: string, destinationNodeId: string): string {
  return [originNodeId, destinationNodeId].sort().join("::");
}

/** Dev-only authored-world visual feedback loop; it owns no game runtime state. */
export function ChartInspector() {
  const [originPortId, setOriginPortId] = useState(STARTING_PORT_ID);
  const [destinationPortId, setDestinationPortId] = useState("faro");
  const diagnostics = useMemo(() => validateCatalog(catalog), []);
  const quote = useMemo(() => quoteFor(originPortId, destinationPortId), [originPortId, destinationPortId]);
  const pairedEdges = useMemo(() => NAV_EDGES.filter((edge) => edge.id.endsWith("outbound")), []);
  const selectedPairKeys = useMemo(
    () =>
      quote.kind === "planned"
        ? new Set(quote.edges.map((edge) => edgePairKey(edge.originNodeId, edge.destinationNodeId)))
        : new Set<string>(),
    [quote],
  );

  return (
    <main className={styles.inspector}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Dev-only authored content</p>
          <h1>Nautical chart inspector</h1>
          <p>Ports are circles, harbor approaches are squares, and headlands are diamonds.</p>
        </div>
        <a href="/debug">Back to tools</a>
      </header>

      <section className={styles.chartPanel} aria-labelledby="chart-heading">
        <h2 id="chart-heading">Authored navigation graph</h2>
        <svg
          className={styles.chart}
          viewBox={CHART_VIEW_BOX}
          role="img"
          aria-label="Authored navigation graph grouped by Region and SubRegion, with the selected passage highlighted"
        >
          <defs>
            <pattern id="chart-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" className={styles.gridLine} fill="none" />
            </pattern>
          </defs>
          <rect
            x={CHART_BOUNDS.minX}
            y={CHART_BOUNDS.minY}
            width={CHART_BOUNDS.maxX - CHART_BOUNDS.minX}
            height={CHART_BOUNDS.maxY - CHART_BOUNDS.minY}
            fill="url(#chart-grid)"
          />
          {REGION_LAYOUTS.map((region) => (
            <g key={region.id}>
              <rect
                className={styles.regionGroup}
                x={region.bounds.minX}
                y={region.bounds.minY}
                width={region.bounds.maxX - region.bounds.minX}
                height={region.bounds.maxY - region.bounds.minY}
                rx="28"
              />
              <text className={styles.regionLabel} x={region.bounds.minX + 20} y={region.bounds.minY + 27}>
                {region.name}
              </text>
            </g>
          ))}
          {SUB_REGION_LAYOUTS.map((subRegion) => (
            <g key={subRegion.id}>
              <rect
                className={styles.subRegionGroup}
                x={subRegion.bounds.minX}
                y={subRegion.bounds.minY}
                width={subRegion.bounds.maxX - subRegion.bounds.minX}
                height={subRegion.bounds.maxY - subRegion.bounds.minY}
                rx="20"
                fill={subRegion.color}
                stroke={subRegion.color}
              />
              <text
                className={styles.subRegionLabel}
                x={subRegion.bounds.minX + 17}
                y={subRegion.bounds.minY + 25}
                fill={subRegion.color}
              >
                {subRegion.name}
              </text>
            </g>
          ))}
          {pairedEdges.map((edge) => {
            const origin = nodePosition(edge.originNodeId);
            const destination = nodePosition(edge.destinationNodeId);
            if (!origin || !destination) return null;
            const midpointX = (origin.x + destination.x) / 2;
            const midpointY = (origin.y + destination.y) / 2;
            const labelOffset = EDGE_LABEL_OFFSETS[edge.id] ?? { x: 0, y: 0 };
            const isBerth =
              WORLD_CONTENT.getPort(edge.originNodeId) !== undefined ||
              WORLD_CONTENT.getPort(edge.destinationNodeId) !== undefined;
            const isSelected = selectedPairKeys.has(edgePairKey(edge.originNodeId, edge.destinationNodeId));
            const primarySubRegion = primarySubRegionId(edge);
            const edgeColor = primarySubRegion ? colorForSubRegion(primarySubRegion) : "#64748b";
            return (
              <g key={edge.id} className={isSelected ? undefined : styles.inactiveEdge}>
                <line className={styles.edgeBase} x1={origin.x} y1={origin.y} x2={destination.x} y2={destination.y} />
                {isSelected && (
                  <line
                    className={styles.selectedRouteHalo}
                    x1={origin.x}
                    y1={origin.y}
                    x2={destination.x}
                    y2={destination.y}
                  />
                )}
                <line
                  className={isBerth ? styles.berthEdge : styles.seaEdge}
                  stroke={isBerth ? undefined : edgeColor}
                  x1={origin.x}
                  y1={origin.y}
                  x2={destination.x}
                  y2={destination.y}
                />
                {!isBerth && (
                  <g transform={`translate(${midpointX + labelOffset.x} ${midpointY + labelOffset.y})`}>
                    <rect
                      className={styles.edgeBadge}
                      x="-72"
                      y="-19"
                      width="144"
                      height="38"
                      rx="19"
                      stroke={edgeColor}
                    />
                    <text className={styles.edgeLabel} y="6" textAnchor="middle">
                      {edge.distance} nm · Risk {edge.staticRisk * 100}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {PORTS.map((port) => (
            <g key={port.id}>
              <circle
                className={`${styles.port} ${port.id === originPortId || port.id === destinationPortId ? styles.selectedNode : ""}`}
                cx={port.chartPosition.x}
                cy={port.chartPosition.y}
                r="20"
              />
              <text
                className={styles.portLabel}
                x={port.chartPosition.x + 32}
                y={port.chartPosition.y + 7}
                textAnchor="start"
              >
                {port.name}
              </text>
            </g>
          ))}
          {NAV_POINTS.map((point) => (
            <g key={point.id}>
              {point.kind === "harbor-approach" ? (
                <rect
                  className={styles.approach}
                  x={point.chartPosition.x - 13}
                  y={point.chartPosition.y - 13}
                  width="26"
                  height="26"
                />
              ) : (
                <rect
                  className={styles.headland}
                  x={point.chartPosition.x - 12}
                  y={point.chartPosition.y - 12}
                  width="24"
                  height="24"
                  transform={`rotate(45 ${point.chartPosition.x} ${point.chartPosition.y})`}
                />
              )}
              <text
                className={styles.nodeLabel}
                x={point.kind === "headland" ? point.chartPosition.x : point.chartPosition.x + 23}
                y={point.kind === "headland" ? point.chartPosition.y - 30 : point.chartPosition.y + 6}
                textAnchor={point.kind === "headland" ? "middle" : "start"}
              >
                {point.name}
              </text>
            </g>
          ))}
        </svg>
        <ul className={styles.legend} aria-label="Chart legend">
          <li>
            <span className={`${styles.lineSwatch} ${styles.selectedSwatch}`} />
            Selected passage halo
          </li>
          <li>
            <span className={`${styles.lineSwatch} ${styles.berthSwatch}`} />
            Berth link (2 nm, no risk)
          </li>
          {SUB_REGIONS.map((subRegion) => (
            <li key={subRegion.id}>
              <span className={styles.swatch} style={{ backgroundColor: colorForSubRegion(subRegion.id) }} />
              {subRegion.name}
            </li>
          ))}
        </ul>
        <p className={styles.chartNote}>
          Region and SubRegion bounds are calculated from their member nodes. A sea edge uses its longest SubRegion
          span; ties use the origin node&apos;s SubRegion.
        </p>
      </section>

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="quote-heading">
          <h2 id="quote-heading">Passage preview</h2>
          <div className={styles.controls}>
            <label>
              Origin
              <select value={originPortId} onChange={(event) => setOriginPortId(event.target.value)}>
                {PORTS.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Destination
              <select value={destinationPortId} onChange={(event) => setDestinationPortId(event.target.value)}>
                {PORTS.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {quote.kind === "denied" ? (
            <p className={styles.denial}>No quote: {quote.reason}.</p>
          ) : (
            <>
              <dl className={styles.summary}>
                <div>
                  <dt>Distance</dt>
                  <dd>{quote.totalDistance} nm</dd>
                </div>
                <div>
                  <dt>Normal time</dt>
                  <dd>{seconds(quote.durationMilliseconds)}</dd>
                </div>
                <div>
                  <dt>Debug time</dt>
                  <dd>
                    {seconds(quote.debugDurationMilliseconds)} ({NAVIGATION_CONSTANTS.debugTimeScale}×)
                  </dd>
                </div>
                <div>
                  <dt>Supplies</dt>
                  <dd>
                    Food {quote.requiredSupplies.food}, Water {quote.requiredSupplies.water}
                  </dd>
                </div>
                <div>
                  <dt>Static risk</dt>
                  <dd>{(quote.staticRisk * 100).toFixed(2)}%</dd>
                </div>
              </dl>
              <ol className={styles.breakdown}>
                {quote.edges.map((edge) => (
                  <li key={edge.id}>
                    <code>{edge.id}</code>: {edge.distance} nm, {(edge.staticRisk * 100).toFixed(1)}% risk
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="diagnostics-heading">
          <h2 id="diagnostics-heading">Catalog diagnostics</h2>
          {diagnostics.length === 0 ? (
            <p className={styles.clean}>No diagnostics — authored world is valid.</p>
          ) : (
            <ul className={styles.diagnostics}>
              {diagnostics.map((diagnostic) => (
                <li key={`${diagnostic.code}-${diagnostic.entry}`}>
                  <code>{diagnostic.code}</code>: {diagnostic.entry} — {diagnostic.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
