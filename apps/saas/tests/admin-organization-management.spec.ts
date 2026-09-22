import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });

test("site administrator edits a nonmember organization without creating a duplicate", async ({
	page,
	playwright,
	baseURL,
}, testInfo) => {
	const id = `qa-org-admin-${randomUUID()}`;
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL required");
	}
	const db = createClient({
		url,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	});
	await db.execute({
		sql: 'INSERT INTO organization (id,name,slug,"createdAt") VALUES (?,?,?,?)',
		args: [id, id, id, Date.now()],
	});
	try {
		const login = await page.request.post("/api/auth/sign-in/email", {
			data: { email: "qa-admin@geostore.test", password: "QaAdmin!2345" },
		});
		expect(login.ok()).toBeTruthy();
		for (const buyer of [false, true]) {
			const request = await playwright.request.newContext({ baseURL });
			try {
				if (buyer) {
					expect(
						(
							await request.post("/api/auth/sign-in/email", {
								data: {
									email: "qa-buyer@geostore.test",
									password: "QaBuyer!2345",
								},
							})
						).ok(),
					).toBeTruthy();
				}
				for (const endpoint of ["find", "update", "delete"]) {
					const response = await request.post(
						`/api/rpc/admin/organizations/${endpoint}`,
						{ data: { json: { id, name: "Unauthorized rename" } } },
					);
					expect(response.status()).toBe(buyer ? 403 : 401);
				}
			} finally {
				await request.dispose();
			}
		}
		await page.goto(`/admin/organizations/${id}`);
		await expect(
			page.getByRole("textbox", {
				name: "Organization name",
				exact: true,
			}),
		).toHaveValue(id);
		await page
			.getByRole("textbox", { name: "Organization name", exact: true })
			.fill(`${id} edited`);
		await page.getByRole("button", { name: "Save", exact: true }).click();
		await expect(
			page.getByText("Organization has been saved.", { exact: true }),
		).toBeVisible();
		await page.reload();
		await expect(
			page.getByRole("textbox", {
				name: "Organization name",
				exact: true,
			}),
		).toHaveValue(`${id} edited`);
		const persisted = await db.execute({
			sql: "SELECT name,slug FROM organization WHERE id = ?",
			args: [id],
		});
		expect(persisted.rows[0]?.name).toBe(`${id} edited`);
		expect(persisted.rows[0]?.slug).toBe(id);
		await page.screenshot({
			path: testInfo.outputPath("nonmember-admin-organization.png"),
			fullPage: true,
		});

		await db.execute({
			sql: "INSERT INTO purchase (id,organizationId,type,customerId,subscriptionId,priceId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)",
			args: [
				id,
				id,
				"SUBSCRIPTION",
				"qa-customer",
				id,
				"qa-price",
				Date.now(),
				Date.now(),
			],
		});
		const blocked = await page.request.post(
			"/api/rpc/admin/organizations/delete",
			{ data: { json: { id } } },
		);
		expect(blocked.status()).toBe(409);
		expect(
			(
				await db.execute({
					sql: "SELECT id FROM organization WHERE id = ?",
					args: [id],
				})
			).rows,
		).toHaveLength(1);
		await db.execute({
			sql: "DELETE FROM purchase WHERE id = ?",
			args: [id],
		});
		const deleted = await page.request.post(
			"/api/rpc/admin/organizations/delete",
			{ data: { json: { id } } },
		);
		expect(deleted.ok()).toBeTruthy();
		expect(
			(
				await db.execute({
					sql: "SELECT id FROM organization WHERE id = ?",
					args: [id],
				})
			).rows,
		).toHaveLength(0);
		await page.goto(`/admin/organizations/${id}`);
		await expect(
			page
				.getByRole("alert")
				.filter({ hasText: "Organization could not be loaded." }),
		).toContainText("Organization could not be loaded.");
		await expect(
			page.getByRole("button", { name: "Save", exact: true }),
		).toHaveCount(0);
	} finally {
		await db.execute({
			sql: "DELETE FROM purchase WHERE id = ?",
			args: [id],
		});
		await db.execute({
			sql: "DELETE FROM organization WHERE id = ?",
			args: [id],
		});
		db.close();
	}
});
