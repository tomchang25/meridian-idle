import { describe, expect, it } from "vitest";
import { PORTS, validateContent } from "@/game/domain/content/core-content";
describe("core content", () => {
  it("provides every playable port with a valid ten-product catalog", () => {
    expect(PORTS).toHaveLength(3);
    expect(validateContent()).toEqual([]);
  });
});
