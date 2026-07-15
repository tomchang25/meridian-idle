import type { RegionDefinition } from "@/game/domain/models/game";

export const REGIONS: RegionDefinition[] = [
  { id: "west-mediterranean", name: "西地中海", tier: 1, familiarity: 146, nextTierAt: 300 },
  { id: "east-mediterranean", name: "東地中海", tier: 2, familiarity: 380, nextTierAt: 600 },
  { id: "north-sea", name: "北海", tier: 0, familiarity: 18, nextTierAt: 100 },
];
