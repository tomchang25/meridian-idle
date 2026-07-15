import { REGIONS } from "@/game/domain/content/regions";
import type { ActionStatus, GameActionDefinition, GameState, Requirement } from "@/game/domain/models/game";

export function isRequirementMet(requirement: Requirement, state: GameState): boolean {
  if (typeof requirement.requiredValue !== "number") return false;

  switch (requirement.type) {
    case "knowledgeLevel":
      return (state.knowledge[requirement.targetId] ?? 0) >= requirement.requiredValue;
    case "skillLevel":
      return (state.skills[requirement.targetId] ?? 0) >= requirement.requiredValue;
    case "masteryLevel":
      return (state.mastery[requirement.targetId] ?? 0) >= requirement.requiredValue;
    case "regionFamiliarity":
      return (
        (REGIONS.find((region) => region.id === requirement.targetId)?.familiarity ?? 0) >= requirement.requiredValue
      );
    case "officerLanguage":
      return false;
    default:
      return false;
  }
}

export function getActionStatus(action: GameActionDefinition, state: GameState): ActionStatus {
  if (state.currentAction?.actionId === action.id) return "running";
  return action.requirements.every((requirement) => isRequirementMet(requirement, state)) ? "available" : "locked";
}

export function getUnmetRequirements(action: GameActionDefinition, state: GameState): Requirement[] {
  return action.requirements.filter((requirement) => !isRequirementMet(requirement, state));
}
