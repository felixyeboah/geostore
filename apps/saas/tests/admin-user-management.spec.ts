import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });
const ADMIN = { email: "qa-admin@geostore.test", password: "QaAdmin!2345" };

// Only the unique fixture account is mutated. Neither verification nor invitation mail is sent.
test("admin creates staff, changes role, bans, unbans, impersonates and deletes through row controls", async ({
	page,
	playwright,
	baseURL,
}, testInfo) => {
	test.setTimeout(180_000);
	const suffix = randomUUID();
	const name = `QA Staff ${suffix}`;
	const email = `qa-staff-${suffix}@example.test`;
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL required for fixture verification");
	}
	const db = createClient({
		url: databaseUrl,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	const origin = new URL(baseURL ?? "http://localhost:3000").origin;
	const cleanup = await playwright.request.newContext({
		baseURL,
		extraHTTPHeaders: { Origin: origin },
	});
	let cleanupFailure: unknown;
	let fixtureId: string | undefined;
	try {
		expect(
			(
				await cleanup.post("/api/auth/sign-in/email", { data: ADMIN })
			).ok(),
		).toBeTruthy();
		expect(
			(
				await page.request.post("/api/auth/sign-in/email", {
					data: ADMIN,
				})
			).ok(),
		).toBeTruthy();
		await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
		await page
			.getByRole("button", { name: "Add a user", exact: true })
			.first()
			.click();
		const sheet = page.getByRole("dialog");
		await expect(sheet).toBeVisible();
		await expect(
			sheet.getByRole("button", { name: "Create user", exact: true }),
		).toBeDisabled();
		await sheet.getByLabel("Name", { exact: true }).fill(name);
		await sheet.getByLabel("Email", { exact: true }).fill(email);
		await sheet
			.getByLabel("Password", { exact: true })
			.fill(`QaFixture!${suffix}`);
		await sheet.getByRole("button", { name: "user", exact: true }).click();
		await sheet
			.getByRole("button", { name: "Create user", exact: true })
			.click();
		await expect(sheet).toBeHidden();
		const row = page.locator("tbody tr").filter({ hasText: email });
		await expect(row).toHaveCount(1);
		const created = await db.execute({
			sql: 'SELECT id,role FROM "user" WHERE email = ?',
			args: [email],
		});
		fixtureId = String(created.rows[0]?.id ?? "");
		expect(fixtureId).not.toBe("");
		expect(created.rows[0]?.role).toBe("user");

		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "Make an admin", exact: true })
			.click();
		await expect(row.getByText("Admin", { exact: true })).toBeVisible();
		expect(
			(
				await db.execute({
					sql: 'SELECT role FROM "user" WHERE id = ?',
					args: [fixtureId],
				})
			).rows[0]?.role,
		).toBe("admin");
		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "Remove admin role", exact: true })
			.click();
		await expect(row.getByText("User", { exact: true })).toBeVisible();

		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "Ban from signing in", exact: true })
			.click();
		await page
			.getByRole("alertdialog")
			.getByRole("button", { name: "Ban", exact: true })
			.click();
		await expect(row.getByText("Banned", { exact: true })).toBeVisible();
		expect(
			Number(
				(
					await db.execute({
						sql: 'SELECT banned FROM "user" WHERE id = ?',
						args: [fixtureId],
					})
				).rows[0]?.banned,
			),
		).toBe(1);
		await page.reload();
		await expect(row.getByText("Banned", { exact: true })).toBeVisible();
		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "Lift the ban", exact: true })
			.click();
		await expect(row.getByText("Banned", { exact: true })).toHaveCount(0);
		expect(
			Number(
				(
					await db.execute({
						sql: 'SELECT banned FROM "user" WHERE id = ?',
						args: [fixtureId],
					})
				).rows[0]?.banned,
			),
		).toBe(0);
		await page.screenshot({
			path: testInfo.outputPath("staff-unbanned.png"),
			fullPage: true,
		});

		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", {
				name: "Sign in as this user",
				exact: true,
			})
			.click();
		await expect
			.poll(async () => {
				const session = await page.request.get("/api/auth/get-session");
				const data = (await session.json()) as {
					user?: { id?: string };
					session?: { impersonatedBy?: string };
				} | null;
				return data?.user?.id;
			})
			.toBe(fixtureId);
		await expect(page).not.toHaveURL(/\/admin\/users/);
		expect(
			(
				await page.request.post("/api/auth/admin/stop-impersonating", {
					headers: { Origin: origin },
					data: {},
				})
			).ok(),
		).toBeTruthy();
		await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
		await expect(row).toHaveCount(1);
		await row
			.getByRole("button", { name: `Actions for ${name}`, exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "Delete account", exact: true })
			.click();
		await page
			.getByRole("alertdialog")
			.getByRole("button", { name: "Delete account", exact: true })
			.click();
		await expect(row).toHaveCount(0);
		expect(
			(
				await db.execute({
					sql: 'SELECT id FROM "user" WHERE email = ?',
					args: [email],
				})
			).rows,
		).toHaveLength(0);
	} finally {
		try {
			// Also discovers an account created just before a browser failure.
			const remaining = await db.execute({
				sql: 'SELECT id FROM "user" WHERE email = ?',
				args: [email],
			});
			for (const user of remaining.rows) {
				const removed = await cleanup.post(
					"/api/auth/admin/remove-user",
					{ data: { userId: String(user.id) } },
				);
				if (!removed.ok()) {
					cleanupFailure = new Error(
						`Fixture cleanup failed with HTTP ${removed.status()} for ${email}`,
					);
				}
			}
		} catch (error) {
			cleanupFailure = error;
			await testInfo.attach("fixture-cleanup-error", {
				body: error instanceof Error ? error.message : String(error),
				contentType: "text/plain",
			});
		} finally {
			await cleanup.dispose();
			db.close();
		}
	}
	if (cleanupFailure) {
		throw cleanupFailure;
	}
});
