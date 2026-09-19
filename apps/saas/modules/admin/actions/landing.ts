"use server";

import { getSession } from "@auth/lib/server";
import { getLandingSectionDefinition } from "@repo/commerce";
import {
	StoreOperationError,
	saveLandingSectionSettings,
	setLandingSectionOrder,
	setLandingSectionVisibility,
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

/**
 * The storefront is a separate deployment, so `revalidatePath` cannot reach
 * it from here. Landing sections are read on every request there, which is
 * what keeps an edit visible immediately; this only refreshes the admin's own
 * view of the list.
 */
function revalidateAdmin() {
	revalidatePath("/admin/landing");
}

export async function setLandingSectionVisibilityAction(
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

		await setLandingSectionVisibility(key, isVisible);
		revalidateAdmin();

		return {
			success: true,
			message: isVisible
				? `${definition.name} is now showing.`
				: `${definition.name} is hidden.`,
		};
	} catch (error) {
		logger.error("Failed to change landing section visibility", { error });
		return { success: false, message: "Could not update that section." };
	}
}

export async function reorderLandingSectionsAction(
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

		await setLandingSectionOrder(known);
		revalidateAdmin();

		return { success: true, message: "Order saved." };
	} catch (error) {
		logger.error("Failed to reorder landing sections", { error });
		return { success: false, message: "Could not save the new order." };
	}
}

export async function saveLandingSectionCopyAction(
	key: string,
	values: Record<string, string>,
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

		// Only fields the section actually declares are stored, and a blank
		// one is dropped rather than saved: an empty string would otherwise
		// have to be told apart from "use the built-in text" on every read.
		const allowed = new Set(definition.fields.map((field) => field.key));
		const settings = Object.fromEntries(
			Object.entries(values).flatMap(([field, value]) =>
				allowed.has(field) && value.trim().length > 0
					? [[field, value.trim()]]
					: [],
			),
		);

		await saveLandingSectionSettings(key, settings);
		revalidateAdmin();

		return {
			success: true,
			message: `${definition.name} saved.`,
		};
	} catch (error) {
		logger.error("Failed to save landing section copy", { error });
		return { success: false, message: "Could not save that section." };
	}
}
