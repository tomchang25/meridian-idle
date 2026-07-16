import type { SupplyId } from "@/game/domain/models/game";

export type CityAction = "market" | "supplies" | "harbor";

export const CITY_ACTIONS: { id: CityAction; label: string; shortLabel: string }[] = [
  { id: "market", label: "Market", shortLabel: "M" },
  { id: "supplies", label: "Supplies Management", shortLabel: "S" },
  { id: "harbor", label: "Harbor", shortLabel: "H" },
];

export const SUPPLY_LABELS: Record<SupplyId, string> = {
  food: "Food",
  water: "Water",
  medicine: "Medicine",
  rope: "Rope",
  sails: "Sails",
};

export function displayName(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
