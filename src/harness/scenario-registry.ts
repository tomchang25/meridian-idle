import type { Scenario } from "@/harness/types";

/**
 * Scenarios register themselves by existing. Adding a file under `scenarios/`
 * is the whole registration step, so no one has to remember to update a list.
 */
const modules = import.meta.glob<{ default: Scenario }>("./scenarios/*.scenario.ts", { eager: true });

const registry = new Map<string, Scenario>();
for (const entry of Object.values(modules)) {
  const scenario = entry.default;
  if (scenario) registry.set(scenario.id, scenario);
}

export function listScenarios(): Scenario[] {
  return [...registry.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function findScenario(id: string | null | undefined): Scenario | undefined {
  return id ? registry.get(id) : undefined;
}

/** Reads the requested scenario from a URL's `scenario` query parameter. */
export function scenarioFromUrl(url: string): Scenario | undefined {
  try {
    return findScenario(new URL(url).searchParams.get("scenario"));
  } catch {
    return undefined;
  }
}
