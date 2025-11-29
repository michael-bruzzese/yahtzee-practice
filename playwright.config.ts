import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD || "previewpw";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    httpCredentials: {
      username: "user",
      password: APP_PASSWORD,
    },
  },
  webServer: {
    command: "npm run start:e2e",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      APP_PASSWORD,
      PORT: String(PORT),
    },
  },
});
