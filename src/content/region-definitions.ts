import type { Region, SubRegion } from "@/core/content/world-content";

export type { Region, SubRegion };

export const REGIONS: Region[] = [
  { id: "iberian-atlantic", name: "Iberian Atlantic" },
  { id: "maghreb-coast", name: "Maghreb Coast" },
];

export const SUB_REGIONS: SubRegion[] = [
  { id: "tagus-approaches", name: "Tagus Approaches", regionId: "iberian-atlantic" },
  { id: "algarve-coast", name: "Algarve Coast", regionId: "iberian-atlantic" },
  { id: "gibraltar-approaches", name: "Gibraltar Approaches", regionId: "maghreb-coast" },
];
