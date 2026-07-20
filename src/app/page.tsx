import type { Metadata } from "next";
import { GameSurface } from "@/app/game-surface";

export const metadata: Metadata = {
  title: "Meridian Idle | Maritime Ledger",
  description: "Trade at historic ports, provision your Fleet, and build routes across known waters.",
};

export default function Home() {
  return <GameSurface />;
}
