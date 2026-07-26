// Covers the full user journey: homepage renders, /join username lookup
// happy-path, and role-toggle updates the `HALL<NN>` code display live.
//
// The /api/join/lookup endpoint is mocked via page.route() so this spec runs
// against a Hugo preview alone — Hall-Monitor doesn't need to be up.

import { expect, test } from "@playwright/test";

const HAPPY_PATH_LOOKUP = {
  eligible: true,
  mc_username: "wenweia",
  guild_tag: "VETS",
  current_contacts_per_role: {
    events: null,
    housing: "existing-housing-uuid",
    warring: null,
    ownership: null,
  },
};

test("homepage renders the Guild Hall intro", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Guild Hall/i);
});

test("/join lookup happy-path shows the role picker", async ({ page }) => {
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HAPPY_PATH_LOOKUP) }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("wenweia");
  await page.getByRole("button", { name: /check eligibility/i }).click();

  await expect(page.locator("#lookup-result")).toContainText("VETS");
  await expect(page.locator("#role-picker")).toBeVisible();
  await expect(page.locator("#code-display")).toBeVisible();
});

test("role toggles update the live `HALL<NN>` code", async ({ page }) => {
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HAPPY_PATH_LOOKUP) }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("wenweia");
  await page.getByRole("button", { name: /check eligibility/i }).click();
  await expect(page.locator("#role-picker")).toBeVisible();

  // Starts at 0.
  await expect(page.locator("#code-line")).toHaveText("HALL00");

  // Events (bit 0) → code 1.
  await page.locator('input[value="events"]').check();
  await expect(page.locator("#code-line")).toHaveText("HALL01");

  // Add Ownership (bit 3) → code 1 | 8 = 9.
  await page.locator('input[value="ownership"]').check();
  await expect(page.locator("#code-line")).toHaveText("HALL09");

  // Ticking Housing (bit 1) surfaces a conflict warning since the mock
  // reports someone already holds Housing for VETS.
  await page.locator('input[value="housing"]').check();
  await expect(page.locator("#code-line")).toHaveText("HALL11");
  await expect(page.locator("#conflict-warnings")).toContainText("existing-housing-uuid");
});

test("/join lookup 404 tells the user the username wasn't found", async ({ page }) => {
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: '{"detail":"username not found"}' }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("nobody");
  await page.getByRole("button", { name: /check eligibility/i }).click();

  await expect(page.locator("#lookup-result")).toContainText("Minecraft account");
  await expect(page.locator("#role-picker")).not.toBeVisible();
});

test("/join lookup shows the not-notable reason distinctly", async ({ page }) => {
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        eligible: false,
        reason: "guild not notable",
        mc_username: "chief",
        guild_tag: "SMLL",
      }),
    }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("chief");
  await page.getByRole("button", { name: /check eligibility/i }).click();

  await expect(page.locator("#lookup-result")).toContainText("SMLL");
  await expect(page.locator("#lookup-result")).toContainText("isn't currently a notable guild");
  await expect(page.locator("#role-picker")).not.toBeVisible();
});
