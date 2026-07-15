import type { GameActionDefinition } from "@/game/domain/models/game";

export const ACTIONS: GameActionDefinition[] = [
  {
    id: "olive-oil-trade",
    name: "橄欖油貿易",
    description: "承接港口商會的橄欖油訂單，建立穩定的區域商路。",
    regionId: "east-mediterranean",
    category: "trade",
    durationSec: 270,
    skillId: "accounting",
    eventRequirement: 40,
    difficultyThreshold: 80,
    requirements: [],
    rewards: [
      { type: "gold", label: "金幣", minAmount: 420, maxAmount: 540 },
      { type: "knowledgeExp", targetId: "food", label: "食品知識", minAmount: 18, maxAmount: 24 },
    ],
    nextMasteryNode: { level: 50, label: "批發模式" },
  },
  {
    id: "strait-survey",
    name: "海峽探勘",
    description: "記錄水深、洋流與暗礁，補完東地中海海圖。",
    regionId: "east-mediterranean",
    category: "navigation",
    durationSec: 480,
    skillId: "sailing",
    eventRequirement: 45,
    difficultyThreshold: 90,
    requirements: [{ type: "knowledgeLevel", targetId: "geography", label: "地理學", requiredValue: 10 }],
    rewards: [
      { type: "gold", label: "金幣", minAmount: 240, maxAmount: 320 },
      { type: "knowledgeExp", targetId: "geography", label: "地理學", minAmount: 30, maxAmount: 42 },
    ],
    nextMasteryNode: { level: 20, label: "精確測量" },
  },
  {
    id: "greek-ruins",
    name: "希臘遺跡發掘",
    description: "循著古代文書尋找被掩埋的港口遺跡。",
    regionId: "east-mediterranean",
    category: "exploration",
    durationSec: 720,
    skillId: "inspection",
    eventRequirement: 60,
    difficultyThreshold: 110,
    requirements: [
      { type: "knowledgeLevel", targetId: "archaeology", label: "考古學", requiredValue: 20 },
      { type: "officerLanguage", targetId: "greek", label: "希臘語支援", requiredValue: 1 },
    ],
    rewards: [
      { type: "fame", label: "學術聲望", minAmount: 24, maxAmount: 40 },
      { type: "item", targetId: "artifact", label: "發現物", minAmount: 0, maxAmount: 1 },
    ],
    nextMasteryNode: { level: 20, label: "發現物品質 +5%" },
  },
  {
    id: "merchant-escort",
    name: "商船護航",
    description: "護送商隊穿越海盜活動頻繁的航段。",
    regionId: "west-mediterranean",
    category: "combat",
    durationSec: 360,
    skillId: "gunnery",
    eventRequirement: 35,
    difficultyThreshold: 75,
    requirements: [],
    rewards: [
      { type: "gold", label: "金幣", minAmount: 320, maxAmount: 460 },
      { type: "fame", label: "海事聲望", minAmount: 8, maxAmount: 14 },
    ],
    nextMasteryNode: { level: 20, label: "護航編隊" },
  },
  {
    id: "timber-contract",
    name: "造船木材契約",
    description: "與北海木材商簽訂長期採購契約。",
    regionId: "north-sea",
    category: "trade",
    durationSec: 540,
    skillId: "negotiation",
    eventRequirement: 55,
    difficultyThreshold: 100,
    requirements: [{ type: "regionFamiliarity", targetId: "north-sea", label: "北海熟悉度", requiredValue: 100 }],
    rewards: [
      { type: "gold", label: "金幣", minAmount: 560, maxAmount: 720 },
      { type: "item", targetId: "oak", label: "北海橡木", minAmount: 2, maxAmount: 4 },
    ],
  },
];

export function getActionDefinition(actionId: string): GameActionDefinition | undefined {
  return ACTIONS.find((action) => action.id === actionId);
}
