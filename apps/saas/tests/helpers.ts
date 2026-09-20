import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Picks an option from one of the admin's selects.
 *
 * `AdminSelect` is a Radix listbox rather than a native `<select>`, so
 * `selectOption` does not reach it — it throws "Element is not a <select>".
 * The open panel is portalled to `<body>`, which is why the option is looked
 * up on the page even when the trigger was found inside a form or a row.
 */
export async function chooseAdminOption(
	page: Page,
	trigger: Locator,
	optionLabel: string | RegExp,
): Promise<void> {
	await trigger.click();
	await page
		.getByRole("option", {
			name: optionLabel,
			exact: typeof optionLabel === "string",
		})
		.click();
	// The listbox closes on selection; waiting for that keeps the next click
	// from landing on the panel's backdrop.
	await expect(page.getByRole("listbox")).toHaveCount(0);
}
