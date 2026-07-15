import type { Metadata } from "next";
import { MeridianDashboard } from "@/game/features/dashboard/meridian-dashboard";

export const metadata: Metadata = {
  title: "Meridian Idle — 航海日誌",
  description: "選擇行動、累積熟練度，逐步把未知海域變成自己的世界。",
};

export default function Home() {
  return <MeridianDashboard />;
}
