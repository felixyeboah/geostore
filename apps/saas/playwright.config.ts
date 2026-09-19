import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// .env.local wins where it exists; .env is the fallback so the suite's own
// teardown can reach DATABASE_URL on a checkout that only has .env. dotenv does
// not overwrite an already-set key, so load order is the precedence order.
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const port = new URL(baseURL).port || "3000";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	// Playwright's default is 30s, which is shorter than the waits these specs
	// ask for: signing in allows 90s and the checkout confirmation 60s. A test
	// whose own assertion timeout exceeds the test timeout can never pass, so the
	// admin and checkout journeys failed on the clock rather than on a defect.
	timeout: 120_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["html"]],
	use: {
		baseURL,
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
	webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
		? undefined
		: {
				command: `pnpm --filter saas run build && pnpm --filter saas exec next start -p ${port}`,
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				stdout: "pipe",
				timeout: 180 * 1000,
			},
});
