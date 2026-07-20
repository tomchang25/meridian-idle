"use client";

import { useEffect, useState } from "react";
import type { Voyage } from "@/core/models/game";
import type { Clock } from "@/runtime/clock";

/**
 * Drives the visible countdown. Time arrives through the injected clock so the
 * countdown can be frozen or advanced in tests rather than racing the wall clock.
 */
export function useVoyageClock(voyage: Voyage, clock: Clock) {
  const [displayNow, setDisplayNow] = useState(0);

  useEffect(() => {
    const updateClock = () => setDisplayNow(clock.now());
    const frame = window.requestAnimationFrame(updateClock);
    const timer = window.setInterval(updateClock, 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [clock, voyage]);

  return displayNow;
}
