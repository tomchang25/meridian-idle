import { describe, expect, it } from "vitest";
import { WORLD_CONTENT } from "@/content/content-catalog";
import type { NavEdge, WorldContent } from "@/core/content/world-content";
import { estimatePassage, planPassage } from "@/core/navigation/passage-planner";

const knownPortIds = ["lisbon", "faro", "tangier"];

function quote(originPortId: string, destinationPortId: string) {
  const plan = planPassage({ world: WORLD_CONTENT, originPortId, destinationPortId, knownPortIds, speed: 100 });
  if (plan.kind === "denied") throw new Error(`Expected passage, received ${plan.reason}.`);
  return estimatePassage(plan, WORLD_CONTENT, 100);
}

describe("passage planner", () => {
  it("pins the authored parity table at normal and debug time scales", () => {
    const lisbonToFaro = quote("lisbon", "faro");
    expect(lisbonToFaro).toMatchObject({
      totalDistance: 20,
      durationMilliseconds: 40_000,
      debugDurationMilliseconds: 2_000,
      requiredSupplies: { food: 1, water: 1 },
    });
    expect(lisbonToFaro.staticRisk).toBeCloseTo(0.0975, 12);
    const faroToTangier = quote("faro", "tangier");
    expect(faroToTangier).toMatchObject({
      totalDistance: 32,
      durationMilliseconds: 64_000,
      debugDurationMilliseconds: 3_200,
      requiredSupplies: { food: 2, water: 2 },
    });
    expect(faroToTangier.staticRisk).toBeCloseTo(0.11, 12);
    const lisbonToTangier = quote("lisbon", "tangier");
    expect(lisbonToTangier).toMatchObject({
      totalDistance: 48,
      durationMilliseconds: 96_000,
      debugDurationMilliseconds: 4_800,
      requiredSupplies: { food: 2, water: 2 },
    });
    expect(lisbonToTangier.staticRisk).toBeCloseTo(0.196775, 12);
  });

  it("uses the same stable edge sequence for equal inputs and passes Faro without docking", () => {
    const first = quote("lisbon", "tangier");
    const second = quote("lisbon", "tangier");
    expect(first.edges.map((edge) => edge.id)).toEqual(second.edges.map((edge) => edge.id));
    expect(first.edges.map((edge) => edge.id)).toContain("faro-tangier-outbound");
    expect(first.edges.flatMap((edge) => [edge.originNodeId, edge.destinationNodeId])).not.toContain("faro");
  });

  it("breaks equal-duration, equal-distance paths by their ordered edge identity", () => {
    const edges: NavEdge[] = [
      {
        id: "beta-first",
        corridorId: "beta-first",
        originNodeId: "lisbon",
        destinationNodeId: "beta",
        distance: 1,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
      {
        id: "beta-last",
        corridorId: "beta-last",
        originNodeId: "beta",
        destinationNodeId: "faro",
        distance: 1,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
      {
        id: "alpha-first",
        corridorId: "alpha-first",
        originNodeId: "lisbon",
        destinationNodeId: "alpha",
        distance: 1,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
      {
        id: "alpha-last",
        corridorId: "alpha-last",
        originNodeId: "alpha",
        destinationNodeId: "faro",
        distance: 1,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
    ];
    const world: WorldContent = {
      ...WORLD_CONTENT,
      getOutgoingNavEdges: (nodeId) => edges.filter((edge) => edge.originNodeId === nodeId),
    };

    const plan = planPassage({ world, originPortId: "lisbon", destinationPortId: "faro", knownPortIds, speed: 100 });

    expect(plan).toMatchObject({ kind: "planned" });
    if (plan.kind !== "planned") return;
    expect(plan.edges.map((edge) => edge.id)).toEqual(["alpha-first", "alpha-last"]);
  });

  it("rounds once after summing the unrounded edge durations", () => {
    const edges: NavEdge[] = [
      {
        id: "first",
        corridorId: "first",
        originNodeId: "lisbon",
        destinationNodeId: "sea",
        distance: 0.25,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
      {
        id: "second",
        corridorId: "second",
        originNodeId: "sea",
        destinationNodeId: "faro",
        distance: 0.25,
        staticRisk: 0,
        traversalModifier: 1,
        spans: [],
      },
    ];
    const world: WorldContent = {
      ...WORLD_CONTENT,
      navigationConstants: { ...WORLD_CONTENT.navigationConstants, timePerDistanceUnitMilliseconds: 1 },
      getOutgoingNavEdges: (nodeId) => edges.filter((edge) => edge.originNodeId === nodeId),
    };
    const plan = planPassage({ world, originPortId: "lisbon", destinationPortId: "faro", knownPortIds, speed: 1 });

    expect(plan).toMatchObject({ kind: "planned", unroundedDurationMilliseconds: 0.5 });
    if (plan.kind !== "planned") return;
    expect(estimatePassage(plan, world, 1).durationMilliseconds).toBe(1);
  });

  it("denies unknown, equal, or unconnected destinations without an approximate quote", () => {
    expect(
      planPassage({
        world: WORLD_CONTENT,
        originPortId: "lisbon",
        destinationPortId: "tangier",
        knownPortIds: ["lisbon"],
        speed: 100,
      }),
    ).toMatchObject({
      kind: "denied",
      reason: "destination-unknown",
    });
    expect(
      planPassage({
        world: WORLD_CONTENT,
        originPortId: "lisbon",
        destinationPortId: "lisbon",
        knownPortIds,
        speed: 100,
      }),
    ).toMatchObject({
      kind: "denied",
      reason: "same-port",
    });
    expect(
      planPassage({
        world: WORLD_CONTENT,
        originPortId: "lisbon",
        destinationPortId: "tangier",
        knownPortIds,
        speed: 100,
        canTraverseEdge: (edge) => edge.id !== "faro-tangier-outbound",
      }),
    ).toMatchObject({ kind: "denied", reason: "no-legal-path" });
  });
});
