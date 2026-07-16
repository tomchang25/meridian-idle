"use client";

import { useEffect, useState } from "react";
import type { Voyage } from "@/game/domain/models/game";

export function useVoyageClock(voyage: Voyage) {
  const [displayNow, setDisplayNow] = useState(0);

  useEffect(() => {
    const updateClock = () => setDisplayNow(Date.now());
    const frame = window.requestAnimationFrame(updateClock);
    const timer = window.setInterval(updateClock, 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [voyage]);

  return displayNow;
}
