"use client";

import { stageLandingCopyAction } from "@admin/actions/landing";
import { LandingFieldControl } from "@admin/components/landing/LandingFieldControl";
import { AdminButton } from "@admin/components/ui";
import {
	type LandingSectionDefinition,
	landingFieldDefault,
	sanitizeLandingCopy,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useState } from "react";

/**
 * A band's wording, edited over the preview.
 *
 * The editor used to hold the right-hand half of the screen permanently, which
 * is what left no room to show the page it was editing. In a sheet it is only
 * present while it is being used, and the preview behind it is the thing the
 * words are going into.
 */
export function LandingSectionSheet({
	definition,
	copy,
	brands,
	onClose,
	onSaved,
}: {
	definition: LandingSectionDefinition | null;
	copy: Record<string, string>;
	brands: string[];
	onClose: () => void;
	onSaved: (copy: Record<string, string>) => void;
}) {
	return (
		<Sheet
			open={Boolean(definition)}
			onOpenChange={(next) => {
				if (!next) {
					onClose();
				}
			}}
		>
			{/*
			 * `editorial` again: Radix portals the panel to <body>, out of
			 * reach of the admin layout's token overrides.
			 */}
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-xl"
			>
				{definition && (
					<SectionEditor
						// A fresh editor per band, so switching never shows
						// the previous one's unsaved text.
						key={definition.key}
						definition={definition}
						copy={copy}
						brands={brands}
						onClose={onClose}
						onSaved={onSaved}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}

function SectionEditor({
	definition,
	copy,
	brands,
	onClose,
	onSaved,
}: {
	definition: LandingSectionDefinition;
	copy: Record<string, string>;
	brands: string[];
	onClose: () => void;
	onSaved: (copy: Record<string, string>) => void;
}) {
	// What the band says right now: the editor's override where there is one,
	// otherwise the words the page ships with. The fields used to start empty
	// behind a "Using the built-in text" placeholder, which meant editing the
	// front page began by guessing what was on it.
	const shipped = Object.fromEntries(
		definition.fields.map((field) => [
			field.key,
			landingFieldDefault(definition.key, field.key),
		]),
	);
	const current = Object.fromEntries(
		definition.fields.map((field) => [
			field.key,
			copy[field.key] ?? shipped[field.key] ?? "",
		]),
	);

	const [values, setValues] = useState<Record<string, string>>(current);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [isSaving, setIsSaving] = useState(false);

	const isDirty = definition.fields.some(
		(field) => (values[field.key] ?? "") !== current[field.key],
	);

	/**
	 * Only genuine differences are stored.
	 *
	 * Prefilling means an untouched field now holds the shipped words rather
	 * than "", so saving as-is would turn every field into an override and
	 * freeze the band against future copy changes. Anything still equal to the
	 * shipped text is dropped, which keeps the blank-means-fallback contract
	 * the storefront relies on.
	 */
	function toOverrides(next: Record<string, string>): Record<string, string> {
		return Object.fromEntries(
			Object.entries(next).filter(([key, value]) => {
				const trimmed = value.trim();
				return trimmed.length > 0 && trimmed !== shipped[key]?.trim();
			}),
		);
	}

	async function save() {
		const overrides = toOverrides(values);

		// Checked here for the instant answer; the action runs the same
		// rules again before anything is stored.
		const { issues } = sanitizeLandingCopy(
			definition,
			Object.fromEntries(
				definition.fields.map((field) => [
					field.key,
					overrides[field.key] ?? "",
				]),
			),
			{ brands },
		);
		if (issues.length > 0) {
			setFieldErrors(
				Object.fromEntries(
					issues.map((issue) => [issue.field, issue.message]),
				),
			);
			return;
		}
		setFieldErrors({});
		setIsSaving(true);

		try {
			const result = await stageLandingCopyAction(
				definition.key,
				// Every field is sent, so one cleared back to the shipped words
				// clears its stored override too.
				Object.fromEntries(
					definition.fields.map((field) => [
						field.key,
						overrides[field.key] ?? "",
					]),
				),
			);

			if (result.success) {
				toastSuccess(result.message);
				onSaved(overrides);
			} else {
				setFieldErrors(result.fieldErrors ?? {});
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
		<>
			<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
				<SheetTitle className="font-semibold text-[20px] text-foreground leading-tight tracking-[-0.02em]">
					{definition.name}
				</SheetTitle>
				<SheetDescription className="text-[13.5px] text-muted-foreground">
					{definition.description}
				</SheetDescription>
			</SheetHeader>

			<div className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
				{definition.fields.length === 0 ? (
					<p className="text-[13.5px] text-muted-foreground leading-[1.6]">
						This band has no editable text — it is built from the
						catalogue. You can still move it or hide it.
					</p>
				) : (
					<div className="grid gap-6 sm:grid-cols-2">
						{definition.fields.map((field) => (
							<div
								key={field.key}
								className={cn(
									field.type !== "text" && "sm:col-span-2",
								)}
							>
								<label
									className="eyebrow block text-muted-foreground"
									htmlFor={`${definition.key}-${field.key}`}
								>
									{field.label}
								</label>
								<div className="mt-2.5">
									<LandingFieldControl
										sectionKey={definition.key}
										field={field}
										value={values[field.key] ?? ""}
										brands={brands}
										onChange={(next) =>
											setValues((previous) => ({
												...previous,
												[field.key]: next,
											}))
										}
									/>
								</div>
								{fieldErrors[field.key] ? (
									<p className="mt-2 text-[12px] text-destructive">
										{fieldErrors[field.key]}
									</p>
								) : (
									field.help && (
										<p className="mt-2 text-[12px] text-muted-foreground">
											{field.help}
										</p>
									)
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{definition.fields.length > 0 && (
				<div className="shrink-0 border-border border-t px-6 py-4">
					<p className="mb-3 text-[12px] text-muted-foreground">
						Fields start on the words the page ships with. Anything
						you leave as it came is not stored, so the band keeps
						following the built-in text.
					</p>
					<div className="flex flex-wrap items-center justify-end gap-2">
						<AdminButton
							onClick={() => setValues(shipped)}
							disabled={isSaving}
						>
							Reset to built-in text
						</AdminButton>
						<AdminButton onClick={onClose} disabled={isSaving}>
							Cancel
						</AdminButton>
						<AdminButton
							variant="primary"
							onClick={save}
							disabled={!isDirty || isSaving}
						>
							{isSaving ? "Saving…" : "Save band"}
						</AdminButton>
					</div>
				</div>
			)}
		</>
	);
}
