import { expect, test } from "@playwright/test";

test("boots the application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Meridian Idle").first()).toBeVisible();
});
