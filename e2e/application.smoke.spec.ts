import { expect, test } from "@playwright/test";

test("boots, provisions, trades, and arrives at a different port", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Meridian Idle").first()).toBeVisible();
  const provisioning = page.getByRole("heading", { name: "Provisioning" }).locator("..");
  await provisioning.getByRole("button", { name: "Buy 1" }).nth(0).click();
  await provisioning.getByRole("button", { name: "Buy 1" }).nth(1).click();
  await page.getByRole("button", { name: "Depart" }).first().click();
  await expect(page.getByRole("heading", { name: "Voyage in progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest arrival" })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole("heading", { name: "Faro" })).toBeVisible();
});
