import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	// The purchase journey waits on a checkout confirmation, which is slower
	// than Playwright's 30s default.
	timeout: 120_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["html"]],
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
		trace: "on-first-retry",
		video: {
			mode: "retain-on-failure",
			size: { width: 640, height: 480 },
		},
	},
	projects: [
		{ name: "setup", testMatch: /.*\.setup\.ts/ },
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],
	webServer: {
		command:
			"pnpm --filter marketing run build && PORT=3001 pnpm --filter marketing run start",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		stdout: "pipe",
		timeout: 180 * 1000,
	},
});
