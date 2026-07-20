import type { Metadata } from "next";
import "./globals.css";
import { PwaRegistration } from "@/platform/pwa/pwa-registration";

export const metadata: Metadata = {
  title: "Meridian Idle",
  description: "A web-first maritime trading and Fleet management game.",
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
    <html lang="en">
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
