"use server";

import { getSession } from "@auth/lib/server";
import {
	getLandingSectionDefinition,
	STOREFRONT_CHROME_DEFAULTS,
	STOREFRONT_CHROME_KEYS,
	type StorefrontChromeKey,
	sanitizeLandingCopy,
	sanitizeStorefrontChrome,
} from "@repo/commerce";
import {
	discardLandingDraft,
	getStoreBrands,
	publishLandingDraft,
	StoreOperationError,
	setLandingSectionDraftOrder,
	setLandingSectionDraftSettings,
	setLandingSectionDraftVisibility,
	stageStorefrontSettings,
} from "@repo/database";
import { logger } from "@repo/logs";
import { revalidatePath } from "next/cache";
import type { AdminActionResult } from "./commerce";

async function requireAdmin() {
	const session = await getSession();

	if (!session || session.user.role !== "admin") {
		throw new StoreOperationError(
			"You do not have permission to perform this action.",
		);
	}

	return session;
}

export interface LandingActionResult extends AdminActionResult {
	/** Per-field validation messages, keyed by the field's settings key. */
	fieldErrors?: Record<string, string>;
}

/**
 * The storefront is a separate deployment, so `revalidatePath` cannot reach
 * it from here. Landing sections are read on every request there, which is
 * what keeps an edit visible immediately; this only refreshes the admin's own
 * view of the list.
 */
function revalidateAdmin() {
	revalidatePath("/admin/landing");
}

export async function stageLandingVisibilityAction(
	key: string,
	isVisible: boolean,
): Promise<AdminActionResult> {
	try {
		await requireAdmin();

		const definition = getLandingSectionDefinition(key);

		if (!definition) {
			return {
				success: false,
				message: "That section no longer exists.",
			};
		}

		if (definition.pinned && !isVisible) {
			return {
				success: false,
				message: `${definition.name} cannot be hidden.`,
			};
		}

		await setLandingSectionDraftVisibility(key, isVisible);
		revalidateAdmin();

		return {
			success: true,
			message: isVisible
				? `${definition.name} will show. Publish to make it live.`
				: `${definition.name} will be hidden. Publish to make it live.`,
		};
	} catch (error) {
		logger.error("Failed to stage landing section visibility", { error });
		return { success: false, message: "Could not stage that change." };
	}
}

export async function stageLandingOrderAction(
	keys: string[],
): Promise<AdminActionResult> {
	try {
		await requireAdmin();

		const known = keys.filter((key) => getLandingSectionDefinition(key));

		if (known.length !== keys.length) {
			return {
				success: false,
				message:
					"That order refers to a section that no longer exists.",
			};
		}

		await setLandingSectionDraftOrder(known);
		revalidateAdmin();

		return {
			success: true,
			message: "Order staged. Publish to make it live.",
		};
	} catch (error) {
		logger.error("Failed to stage landing section order", { error });
		return { success: false, message: "Could not stage the new order." };
	}
}

export async function stageLandingCopyAction(
	key: string,
	values: Record<string, string>,
): Promise<LandingActionResult> {
	try {
		await requireAdmin();

		const definition = getLandingSectionDefinition(key);

		if (!definition) {
			return {
				success: false,
				message: "That section no longer exists.",
			};
		}

		// The editor validates too, but client checks are only a courtesy —
		// the same rules run here before anything is stored.
		const { settings, issues } = sanitizeLandingCopy(definition, values, {
			brands: await getStoreBrands(),
		});

		if (issues.length > 0) {
			return {
				success: false,
				message: issues[0]?.message ?? "Check the highlighted fields.",
				fieldErrors: Object.fromEntries(
					issues.map((issue) => [issue.field, issue.message]),
				),
			};
		}

		await setLandingSectionDraftSettings(key, settings);
		revalidateAdmin();

		return {
			success: true,
			message: `${definition.name} staged. Publish to make it live.`,
		};
	} catch (error) {
		logger.error("Failed to stage landing section copy", { error });
		return { success: false, message: "Could not stage that section." };
	}
}

/**
 * Stages storefront chrome — the announcement strip, phone number and footer
 * lines. `values` is the whole form: a blank field stages a revert to the
 * shipped default, and anything still equal to its published value is a
 * no-op inside `stageStorefrontSettings`.
 */
export async function stageStorefrontChromeAction(
	values: Record<string, string>,
): Promise<LandingActionResult> {
	try {
		await requireAdmin();

		const { overrides, issues } = sanitizeStorefrontChrome(values);

		if (issues.length > 0) {
			return {
				success: false,
				message: issues[0]?.message ?? "Check the highlighted fields.",
				fieldErrors: Object.fromEntries(
					issues.map((issue) => [issue.key, issue.message]),
				),
			};
		}

		// Validation passed, so a non-blank value is in `overrides`. A blank
		// stages a revert to the shipped default — and so does a field still
		// equal to it, which keeps "publish" from freezing the shipped words
		// into overrides the editor never meant to write.
		const staged: Record<string, string> = {};
		for (const key of Object.keys(values)) {
			if (STOREFRONT_CHROME_KEYS.has(key)) {
				const value = overrides[key] ?? "";
				staged[key] =
					value ===
					STOREFRONT_CHROME_DEFAULTS[key as StorefrontChromeKey]
						? ""
						: value;
			}
		}

		await stageStorefrontSettings(staged);
		revalidateAdmin();

		return {
			success: true,
			message: "Storefront text staged. Publish to make it live.",
		};
	} catch (error) {
		logger.error("Failed to stage storefront chrome", { error });
		return { success: false, message: "Could not stage that text." };
	}
}

/**
 * Publishes everything staged on the storefront screen — section order,
 * visibility, copy and the chrome fields — in one transaction. Only rows that
 * actually changed write a revision, so the history stays readable.
 */
export async function publishLandingChangesAction(): Promise<AdminActionResult> {
	try {
		const session = await requireAdmin();

		const result = await publishLandingDraft({
			id: session.user.id,
			name: session.user.name ?? session.user.email,
		});
		revalidateAdmin();

		const total = result.sections + result.settings;
		return {
			success: true,
			message:
				total === 0
					? "Nothing was staged — the live page is unchanged."
					: `Published ${total} ${total === 1 ? "change" : "changes"}.`,
		};
	} catch (error) {
		logger.error("Failed to publish landing changes", { error });
		return { success: false, message: "Could not publish the changes." };
	}
}

export async function discardLandingChangesAction(): Promise<AdminActionResult> {
	try {
		await requireAdmin();

		await discardLandingDraft();
		revalidateAdmin();

		return {
			success: true,
			message: "Draft discarded — the page is back to what is live.",
		};
	} catch (error) {
		logger.error("Failed to discard landing changes", { error });
		return { success: false, message: "Could not discard the draft." };
	}
}
