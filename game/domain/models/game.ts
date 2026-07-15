export type ActionCategory = "trade" | "exploration" | "navigation" | "combat" | "expedition";

export type ActionFilter = "all" | ActionCategory;
export type ActionStatus = "available" | "locked" | "running";
export type RequirementType =
  "knowledgeLevel" | "skillLevel" | "masteryLevel" | "regionFamiliarity" | "officerLanguage" | "shipStat" | "item";

export type RewardType = "gold" | "fame" | "knowledgeExp" | "skillExp" | "masteryExp" | "item";

export type Requirement = {
  type: RequirementType;
  targetId: string;
  label: string;
  requiredValue: number | string;
};

export type RewardPreview = {
  type: RewardType;
  targetId?: string;
  label: string;
  minAmount: number;
  maxAmount: number;
};

export type GameActionDefinition = {
  id: string;
  name: string;
  description: string;
  regionId: string;
  category: ActionCategory;
  durationSec: number;
  skillId: string;
  eventRequirement: number;
  difficultyThreshold: number;
  requirements: Requirement[];
  rewards: RewardPreview[];
  nextMasteryNode?: { level: number; label: string };
};

export type RegionDefinition = {
  id: string;
  name: string;
  tier: number;
  familiarity: number;
  nextTierAt: number;
};

export type RunningAction = {
  actionId: string;
  startedAt: number;
  cycleStartedAt: number;
  cycleEndsAt: number;
};

export type GameLogEntry = {
  id: string;
  at: number;
  message: string;
  tone: "info" | "success" | "warning";
};

export type GameState = {
  captain: {
    name: string;
    rank: string;
    level: number;
  };
  resources: {
    gold: number;
    fame: number;
  };
  knowledge: Record<string, number>;
  skills: Record<string, number>;
  mastery: Record<string, number>;
  selectedRegionId: string;
  selectedCategory: ActionFilter;
  currentAction: RunningAction | null;
  eventLog: GameLogEntry[];
  lastSavedAt: number;
};

export type CheckBreakdown = {
  successRate: number;
  greatSuccessRate: number;
  baseScore: number;
  rollMin: number;
  rollMax: number;
  skillId: string;
  skillValue: number;
  eventRequirement: number;
};
