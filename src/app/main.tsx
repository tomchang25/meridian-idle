import { createRoot } from "react-dom/client";
import { GameSurface } from "@/app/game-surface";
import "./globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root is missing from index.html");

createRoot(rootElement).render(<GameSurface />);
