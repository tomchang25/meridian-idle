import type { GameState } from "@/game/domain/models/game";

export function createInitialGameState(now = Date.now()): GameState {
  return {
    captain: { name: "卡洛斯", rank: "見習航海家", level: 18 },
    resources: { gold: 12_480, fame: 340 },
    knowledge: { food: 12, geography: 16, archaeology: 8 },
    skills: { accounting: 41, sailing: 34, inspection: 22, gunnery: 28, negotiation: 31 },
    mastery: { "olive-oil-trade": 47, "strait-survey": 12, "merchant-escort": 8 },
    selectedRegionId: "east-mediterranean",
    selectedCategory: "all",
    currentAction: null,
    eventLog: [{ id: "welcome", at: now, message: "航海日誌已就緒。選擇一項行動開始準備。", tone: "info" }],
    lastSavedAt: now,
  };
}
