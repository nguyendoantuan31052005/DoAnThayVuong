import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5175",
    headless: true,
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : undefined,
  },
  webServer: [
    {
      command: "node e2e/server.cjs",
      url: "http://127.0.0.1:3015/api/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run preview -- --host 127.0.0.1 --port 5175",
      url: "http://127.0.0.1:5175",
      env: { BACKEND_URL: "http://127.0.0.1:3015" },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
