// Playwright config for Hallway end-to-end specs.
// Points at a locally-served preview by default; override HALLWAY_BASE_URL
// to target a staging environment.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 30_000,
  use: {
    baseURL: process.env.HALLWAY_BASE_URL || "http://localhost:1313",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
