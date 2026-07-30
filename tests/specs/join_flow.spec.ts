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

// /about is a hub, not prose: one card per sub-page, built from the About
// group in menus.en.toml. A card missing here means the menu and the page have
// come apart, which is silent — the shortcode just renders one card fewer.
test("/about offers a card into each of the four sub-pages", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: /about the guild hall/i })).toBeVisible();

  const cards = page.locator("nav.hall-sections a.hall-section");
  await expect(cards).toHaveCount(4);
  for (const [href, label] of [
    ["/about/what/", "What"],
    ["/about/why/", "Why"],
    ["/about/who/", "Who"],
    ["/about/how/", "How"],
  ]) {
    const card = page.locator(`nav.hall-sections a[href="${href}"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText(label);
  }
});

test("each sub-page links back up to /about", async ({ page }) => {
  for (const path of ["/about/what/", "/about/why/", "/about/who/", "/about/how/"]) {
    await page.goto(path);
    const back = page.locator("a.hall-back");
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute("href", "/about/");
  }
});

// The four pages moved from /<name>/ to /about/<name>/. `aliases:` front matter
// leaves a redirect stub behind at each old path; without it every link already
// shared into Discord 404s.
test("the pre-move URLs still land on the right page", async ({ page }) => {
  for (const [old, moved] of [
    ["/what/", "/about/what/"],
    ["/why/", "/about/why/"],
    ["/who/", "/about/who/"],
    ["/how/", "/about/how/"],
  ]) {
    await page.goto(old);
    await page.waitForURL(`**${moved}`);
  }
});

// The four anchors the sub-pages link to each other by. Nothing in the build
// warns when a heading is reworded, so the link just quietly stops scrolling.
test("the cross-linked heading anchors exist", async ({ page }) => {
  for (const [path, anchor] of [
    ["/about/what/", "available-seats"],
    ["/about/what/", "services"],
    ["/about/who/", "what-guilds-are-represented"],
    ["/about/how/", "claiming-your-seat"],
  ]) {
    await page.goto(path);
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }
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
