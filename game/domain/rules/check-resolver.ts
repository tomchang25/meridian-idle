import type { CheckBreakdown, GameActionDefinition, GameState } from "@/game/domain/models/game";

function chanceAtLeast(target: number, min: number, max: number): number {
  if (target <= min) return 1;
  if (target > max) return 0;
  return (max - target) / (max - min);
}

export function calculateCheckBreakdown(action: GameActionDefinition, state: GameState): CheckBreakdown {
  const skillValue = state.skills[action.skillId] ?? 1;
  const mastery = state.mastery[action.id] ?? 0;
  const baseScore = 42 + Math.floor(mastery * 0.4);
  const effectiveSkill = skillValue;
  const rollMin = (effectiveSkill * effectiveSkill) / (effectiveSkill + action.eventRequirement);
  const rollMax = (effectiveSkill * effectiveSkill) / action.eventRequirement;
  const successTarget = action.difficultyThreshold - baseScore;
  const greatSuccessTarget = action.difficultyThreshold * 2 - baseScore;

  return {
    successRate: chanceAtLeast(successTarget, rollMin, rollMax),
    greatSuccessRate: chanceAtLeast(greatSuccessTarget, rollMin, rollMax),
    baseScore,
    rollMin,
    rollMax,
    skillId: action.skillId,
    skillValue,
    eventRequirement: action.eventRequirement,
  };
}
