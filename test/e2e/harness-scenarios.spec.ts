import { expect, test } from "@playwright/test";

/**
 * Proves the harness contract: a browser test can start mid-flow from an
 * authored world and reach a Voyage arrival by moving simulated time, rather
 * than by waiting out the real duration.
 */
test("loads a mid-voyage scenario and reaches arrival by advancing simulated time", async ({ page }) => {
  await page.goto("/debug/game?scenario=mid-voyage");

  await expect(page.getByRole("heading", { name: "Lisbon to Faro" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest arrival" })).toBeHidden();

  const debugApi = await page.evaluate(() => Boolean(window.__MERIDIAN__));
  expect(debugApi).toBe(true);

  await page.evaluate(() => window.__MERIDIAN__!.advanceTime(10_000));

  await expect(page.getByRole("heading", { name: "Latest arrival" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Port operations at Faro" })).toBeVisible();

  const locationPortId = await page.evaluate(() => window.__MERIDIAN__!.getState().fleet.locationPortId);
  expect(locationPortId).toBe("faro");
});

test("exposes the registered scenarios and leaves ordinary play unharnessed", async ({ page }) => {
  await page.goto("/debug/game?scenario=docked-wealthy");
  // The interface is published after hydration, so wait for it rather than
  // racing the navigation.
  await page.waitForFunction(() => Boolean(window.__MERIDIAN__));

  expect(await page.evaluate(() => window.__MERIDIAN__!.scenarios())).toContain("mid-voyage");
  expect(await page.evaluate(() => window.__MERIDIAN__!.getState().fleet.gold)).toBe(50_000);

  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  expect(await page.evaluate(() => Boolean(window.__MERIDIAN__))).toBe(false);
});

test("lists dev tools at the debug hub and falls back to it for unknown paths", async ({ page }) => {
  await page.goto("/debug");
  await expect(page.getByRole("heading", { name: "Meridian debug tools" })).toBeVisible();
  const testbedLink = page.getByRole("link", { name: "Scenario testbed" });
  await expect(testbedLink).toHaveAttribute("href", "/debug/game");

  // An unknown dev path falls back to the hub rather than white-screening.
  await page.goto("/debug/does-not-exist");
  await expect(page.getByRole("heading", { name: "Meridian debug tools" })).toBeVisible();
});
