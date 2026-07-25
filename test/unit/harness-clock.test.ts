import { describe, expect, it } from "vitest";
import { createHarnessClock, createScaledClock } from "@/harness/harness-clock";

describe("scaled harness clock", () => {
  it("multiplies elapsed base-clock time while retaining its initial timestamp", () => {
    const base = createHarnessClock(100);
    const scaled = createScaledClock(base, 20);

    expect(scaled.now()).toBe(100);
    base.advance(250);
    expect(scaled.now()).toBe(5_100);
  });
});
