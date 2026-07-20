import type { Route } from "@/core/content/world-content";

export type { Route };

export const ROUTES: Route[] = [
  {
    id: "lisbon-faro",
    originPortId: "lisbon",
    destinationPortId: "faro",
    distance: 20,
    durationMilliseconds: 2_000,
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  {
    id: "faro-lisbon",
    originPortId: "faro",
    destinationPortId: "lisbon",
    distance: 20,
    durationMilliseconds: 2_000,
    staticRisk: 0.1,
    requiredSupplies: { food: 1, water: 1 },
  },
  {
    id: "lisbon-tangier",
    originPortId: "lisbon",
    destinationPortId: "tangier",
    distance: 50,
    durationMilliseconds: 5_000,
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  {
    id: "tangier-lisbon",
    originPortId: "tangier",
    destinationPortId: "lisbon",
    distance: 50,
    durationMilliseconds: 5_000,
    staticRisk: 0.2,
    requiredSupplies: { food: 2, water: 2 },
  },
  {
    id: "faro-tangier",
    originPortId: "faro",
    destinationPortId: "tangier",
    distance: 35,
    durationMilliseconds: 4_000,
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
  {
    id: "tangier-faro",
    originPortId: "tangier",
    destinationPortId: "faro",
    distance: 35,
    durationMilliseconds: 4_000,
    staticRisk: 0.15,
    requiredSupplies: { food: 2, water: 1 },
  },
];
