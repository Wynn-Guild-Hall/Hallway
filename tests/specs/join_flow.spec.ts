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

const NOT_MAJOR_LOOKUP = {
  eligible: false,
  reason: "guild not major",
  mc_username: "chief",
  guild_tag: "SMLL",
};

test("homepage renders the Guild Hall intro", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Guild Hall/i);
  await expect(page.getByRole("link", { name: /join the hall/i })).toBeVisible();
});

// Discord's `-#` subtext marker is not markdown — layouts/partials/subtext.html
// rewrites it after rendering. The failure mode if that stops running is quiet:
// the line still shows, just with a literal `-#` glued to the front of it.
test("homepage renders the `-#` disclaimer as subtext, not as literal text", async ({ page }) => {
  await page.goto("/");
  const subtext = page.locator("p.hall-subtext").filter({ hasText: /Membership does not imply/i });
  await expect(subtext).toBeVisible();
  await expect(subtext).not.toContainText("-#");
  await expect(page.locator("body")).not.toContainText("-#");
});

test("/about explains representation and links to /join", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: /about the guild hall/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /how representation works/i })).toBeVisible();
  await expect(page.locator('a[href="/join/"]').first()).toBeVisible();
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

// A second lookup has to clear the first one's UI. Otherwise an eligible
// name followed by an ineligible one leaves the earlier name's role
// checkboxes and code on screen, attached to a lookup that no longer holds.
test("an ineligible second lookup clears the first lookup's picker", async ({ page }) => {
  let payload = HAPPY_PATH_LOOKUP;
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("wenweia");
  await page.getByRole("button", { name: /check eligibility/i }).click();
  await expect(page.locator("#role-picker")).toBeVisible();

  await page.locator('input[value="ownership"]').check();
  await expect(page.locator("#code-line")).toHaveText("HALL08");

  payload = NOT_MAJOR_LOOKUP;
  await page.locator("#username").fill("chief");
  await page.getByRole("button", { name: /check eligibility/i }).click();

  await expect(page.locator("#lookup-result")).toContainText("isn't currently a major guild");
  await expect(page.locator("#role-picker")).not.toBeVisible();
  await expect(page.locator("#code-display")).not.toBeVisible();
});

test("/join lookup shows the not-major reason distinctly", async ({ page }) => {
  await page.route("**/api/join/lookup*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(NOT_MAJOR_LOOKUP),
    }),
  );

  await page.goto("/join/");
  await page.locator("#username").fill("chief");
  await page.getByRole("button", { name: /check eligibility/i }).click();

  await expect(page.locator("#lookup-result")).toContainText("SMLL");
  await expect(page.locator("#lookup-result")).toContainText("isn't currently a major guild");
  await expect(page.locator("#role-picker")).not.toBeVisible();
});
