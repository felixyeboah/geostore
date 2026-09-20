"use client";

import { stageStorefrontChromeAction } from "@admin/actions/landing";
import { AdminButton, AdminField, AdminInput } from "@admin/components/ui";
import {
	STOREFRONT_CHROME_DEFAULTS,
	STOREFRONT_CHROME_FIELDS,
	type StorefrontChrome,
	sanitizeStorefrontChrome,
} from "@repo/commerce";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useState } from "react";

/**
 * The words around the page rather than in it — the announcement strip, the
 * phone number and the footer's sign-off lines. Each shows what the
 * storefront says now; saving stages the change, and clearing a field puts
 * the shipped words back.
 */
export function StorefrontChromeCard({
	values,
	disabled,
	onSaved,
}: {
	/** The resolved draft — what the storefront will say once published. */
	values: StorefrontChrome;
	disabled?: boolean;
	onSaved: (values: StorefrontChrome) => void;
}) {
	const [form, setForm] = useState<Record<string, string>>({ ...values });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);

	const isDirty = STOREFRONT_CHROME_FIELDS.some(
		(field) => (form[field.key] ?? "") !== values[field.key],
	);

	async function save() {
		// Client-side first — the server runs the same check, so this only
		// saves a round trip.
		const { issues } = sanitizeStorefrontChrome(form);
		if (issues.length > 0) {
			setErrors(
				Object.fromEntries(
					issues.map((issue) => [issue.key, issue.message]),
				),
			);
			return;
		}
		setErrors({});
		setIsSaving(true);

		try {
			const result = await stageStorefrontChromeAction(form);
			if (result.success) {
				toastSuccess(result.message);
				// What the draft resolves to: staged text, or the default
				// where a field was cleared.
				onSaved(
					Object.fromEntries(
						STOREFRONT_CHROME_FIELDS.map((field) => [
							field.key,
							form[field.key]?.trim() ||
								STOREFRONT_CHROME_DEFAULTS[field.key],
						]),
					) as StorefrontChrome,
				);
			} else {
				setErrors(result.fieldErrors ?? {});
				toastError(result.message);
			}
		} catch {
			toastError(
				"The change never reached the server — check your connection and try again.",
			);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="mt-10">
			<div className="flex items-baseline justify-between gap-3 border-border border-b pb-3">
				<p className="eyebrow text-muted-foreground">Storefront text</p>
			</div>

			<div className="mt-5 grid gap-5">
				{STOREFRONT_CHROME_FIELDS.map((field) => (
					<AdminField
						key={field.key}
						label={field.label}
						htmlFor={`chrome-${field.key}`}
						hint={field.help}
						error={errors[field.key]}
					>
						<AdminInput
							id={`chrome-${field.key}`}
							inputSize="sm"
							value={form[field.key] ?? ""}
							maxLength={field.maxLength + 40}
							aria-invalid={Boolean(errors[field.key])}
							placeholder={STOREFRONT_CHROME_DEFAULTS[field.key]}
							onChange={(event) =>
								setForm((previous) => ({
									...previous,
									[field.key]: event.target.value,
								}))
							}
						/>
					</AdminField>
				))}
			</div>

			<div className="mt-5 flex items-center justify-between gap-3">
				<p className="text-[12px] text-muted-foreground">
					Clearing a field restores the built-in text.
				</p>
				<AdminButton
					size="sm"
					onClick={save}
					disabled={!isDirty || isSaving || disabled}
				>
					{isSaving ? "Saving…" : "Stage changes"}
				</AdminButton>
			</div>
		</div>
	);
}
