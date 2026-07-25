import { expect, test } from "@playwright/test";

/**
 * The one check that the real, unharnessed application boots, trades, and sails
 * under the system clock. It stops at the first sailing boundary rather than at
 * arrival: ordinary play has no time scale, so waiting out the full 40-second
 * Passage would buy nothing this does not already prove. Arrival settlement is
 * covered by the harness scenario, which drives the same runtime and resolver.
 */
test("boots, provisions, departs, and advances through a real sailing boundary", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Meridian Idle").first()).toBeVisible();
  const recovery = page.getByRole("button", { name: "Start a new V5 game" });
  if (await recovery.isVisible()) await recovery.click();
  await page.getByRole("button", { name: /Supplies Management/ }).click();
  const provisioning = page.getByRole("heading", { name: "Provision Stores" }).locator("xpath=ancestor::section[1]");
  const food = provisioning.getByText("Food", { exact: true }).locator("xpath=ancestor::li[1]");
  const water = provisioning.getByText("Water", { exact: true }).locator("xpath=ancestor::li[1]");
  await food.getByRole("spinbutton", { name: "Food target quantity" }).fill("1");
  await water.getByRole("spinbutton", { name: "Water target quantity" }).fill("1");
  await provisioning.getByRole("button", { name: "Restock all now" }).click();
  await expect(food.getByText("1 aboard", { exact: false })).toBeVisible();
  await expect(water.getByText("1 aboard", { exact: false })).toBeVisible();
  await provisioning.getByRole("checkbox", { name: /Auto-restock on Voyage arrival/ }).check();
  await page.getByRole("button", { name: /Harbor/ }).click();
  await page.getByRole("button", { name: /Faro, select destination/ }).click();
  await page.getByRole("button", { name: "Set Sail for Faro" }).click();
  await expect(page.getByRole("heading", { name: "Lisbon to Faro" })).toBeVisible();
  await expect(page.getByText("1 of 4 · 4 edges remaining")).toBeVisible();

  // The first edge ends 4 simulated seconds out, and nothing here scales time,
  // so crossing it takes 4 real ones. Reaching leg 2 can only happen by a real
  // browser timer waking the resolver and the interface following it.
  await expect(page.getByText("2 of 4 · 3 edges remaining")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Latest arrival" })).toBeHidden();
});
