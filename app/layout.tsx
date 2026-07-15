import type { Metadata } from "next";
import "./globals.css";
import { PwaRegistration } from "@/game/infrastructure/pwa/pwa-registration";

export const metadata: Metadata = {
  title: "Meridian Idle",
  description: "培養船長、配置副官並開拓未知海域的航海增量遊戲。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
