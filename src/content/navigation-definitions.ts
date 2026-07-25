import type { NavEdge, NavigationConstants, NavPoint } from "@/core/content/world-content";

export type { NavEdge, NavigationConstants, NavPoint };

export const TIME_PER_DISTANCE_UNIT_MS = 200_000;
export const SUPPLY_CONSUMPTION_PER_SECOND = { food: 0.02, water: 0.02 } as const;
export const DEBUG_TIME_SCALE = 20;

export const NAVIGATION_CONSTANTS: NavigationConstants = {
  timePerDistanceUnitMilliseconds: TIME_PER_DISTANCE_UNIT_MS,
  supplyConsumptionPerSecond: SUPPLY_CONSUMPTION_PER_SECOND,
  debugTimeScale: DEBUG_TIME_SCALE,
};

export const NAV_POINTS: NavPoint[] = [
  {
    id: "lisbon-approach",
    name: "Lisbon Approach",
    kind: "harbor-approach",
    harborPortId: "lisbon",
    subRegionId: "tagus-approaches",
    chartPosition: { x: 225, y: 240 },
  },
  {
    id: "faro-approach",
    name: "Faro Approach",
    kind: "harbor-approach",
    harborPortId: "faro",
    subRegionId: "algarve-coast",
    chartPosition: { x: 500, y: 540 },
  },
  {
    id: "tangier-approach",
    name: "Tangier Approach",
    kind: "harbor-approach",
    harborPortId: "tangier",
    subRegionId: "gibraltar-approaches",
    chartPosition: { x: 740, y: 720 },
  },
  {
    id: "cape-st-vincent",
    name: "Cape St. Vincent",
    kind: "headland",
    subRegionId: "algarve-coast",
    chartPosition: { x: 210, y: 500 },
  },
];

function directedPair(
  id: string,
  originNodeId: string,
  destinationNodeId: string,
  distance: number,
  staticRisk: number,
  spans: NavEdge["spans"],
): NavEdge[] {
  return [
    { id: `${id}-outbound`, originNodeId, destinationNodeId, distance, staticRisk, traversalModifier: 1, spans },
    {
      id: `${id}-inbound`,
      originNodeId: destinationNodeId,
      destinationNodeId: originNodeId,
      distance,
      staticRisk,
      traversalModifier: 1,
      spans,
    },
  ];
}

export const NAV_EDGES: NavEdge[] = [
  ...directedPair("lisbon-berth", "lisbon", "lisbon-approach", 2, 0, [
    { subRegionId: "tagus-approaches", distance: 2 },
  ]),
  ...directedPair("lisbon-cape", "lisbon-approach", "cape-st-vincent", 8, 0.05, [
    { subRegionId: "tagus-approaches", distance: 4 },
    { subRegionId: "algarve-coast", distance: 4 },
  ]),
  ...directedPair("cape-faro", "cape-st-vincent", "faro-approach", 8, 0.05, [
    { subRegionId: "algarve-coast", distance: 8 },
  ]),
  ...directedPair("faro-tangier", "faro-approach", "tangier-approach", 28, 0.11, [
    { subRegionId: "algarve-coast", distance: 8 },
    { subRegionId: "gibraltar-approaches", distance: 20 },
  ]),
  ...directedPair("faro-berth", "faro", "faro-approach", 2, 0, [{ subRegionId: "algarve-coast", distance: 2 }]),
  ...directedPair("tangier-berth", "tangier", "tangier-approach", 2, 0, [
    { subRegionId: "gibraltar-approaches", distance: 2 },
  ]),
];
