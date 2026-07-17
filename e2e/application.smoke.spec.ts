import { expect, test } from "@playwright/test";

test("boots, provisions, departs, and arrives at a different port", async ({ page }) => {
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
  await food.getByRole("button", { name: "Apply" }).click();
  await expect(food.getByText("1 aboard", { exact: false })).toBeVisible();
  await water.getByRole("spinbutton", { name: "Water target quantity" }).fill("1");
  await water.getByRole("button", { name: "Apply" }).click();
  await expect(water.getByText("1 aboard", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /Harbor/ }).click();
  await page.getByRole("button", { name: "Depart for Faro" }).click();
  await expect(page.getByRole("heading", { name: "Lisbon to Faro" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest arrival" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "Port operations at Faro" })).toBeVisible();
});
