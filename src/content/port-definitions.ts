import type { Port, PortCatalogEntry } from "@/core/content/world-content";

export type { Port, PortCatalogEntry };

/** Where a new world's Fleet is docked, and the root of the reachability check. */
export const STARTING_PORT_ID = "lisbon";

/** Expands the authored tier distribution: four basic, three advanced, one Specialty, two final. */
const catalog = (basic: string[], advanced: string[], specialty: string, final: string[]): PortCatalogEntry[] => [
  ...basic.map((productId) => ({ productId, unlockLevel: 1 as const })),
  ...advanced.map((productId) => ({ productId, unlockLevel: 20 as const })),
  { productId: specialty, unlockLevel: 50 as const },
  ...final.map((productId) => ({ productId, unlockLevel: 75 as const })),
];

export const PORTS: Port[] = [
  {
    id: "lisbon",
    name: "Lisbon",
    regionId: "iberian-atlantic",
    catalog: catalog(["cod", "olive-oil", "wool-cloth", "iron-ingot"], ["salt", "wine", "rope"], "lisbon-cork", [
      "ceramic",
      "glassware",
    ]),
  },
  {
    id: "faro",
    name: "Faro",
    regionId: "iberian-atlantic",
    catalog: catalog(["tuna", "olive-oil", "wool-cloth", "salt"], ["wine", "rope", "copper-ingot"], "faro-pig", [
      "iron-ingot",
      "glassware",
    ]),
  },
  {
    id: "tangier",
    name: "Tangier",
    regionId: "maghreb-coast",
    catalog: catalog(
      ["barley", "olive-oil", "wool-cloth", "copper-ingot"],
      ["salt", "wine", "leather"],
      "tangier-dyed-leather",
      ["iron-ingot", "ceramic"],
    ),
  },
];
