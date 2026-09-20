"use client";

import { saveLandingSectionCopyAction } from "@admin/actions/landing";
import { AdminButton, AdminInput, AdminTextarea } from "@admin/components/ui";
import type { LandingSectionDefinition } from "@repo/commerce";
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
	onClose,
	onSaved,
}: {
	definition: LandingSectionDefinition | null;
	copy: Record<string, string>;
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
	onClose,
	onSaved,
}: {
	definition: LandingSectionDefinition;
	copy: Record<string, string>;
	onClose: () => void;
	onSaved: (copy: Record<string, string>) => void;
}) {
	const [values, setValues] = useState<Record<string, string>>(() =>
		Object.fromEntries(
			definition.fields.map((field) => [
				field.key,
				copy[field.key] ?? "",
			]),
		),
	);
	const [isSaving, setIsSaving] = useState(false);

	const isDirty = definition.fields.some(
		(field) => (values[field.key] ?? "") !== (copy[field.key] ?? ""),
	);

	async function save() {
		setIsSaving(true);
		const result = await saveLandingSectionCopyAction(
			definition.key,
			values,
		);
		setIsSaving(false);

		if (result.success) {
			toastSuccess(result.message);
			onSaved(
				Object.fromEntries(
					Object.entries(values).filter(
						([, value]) => value.trim().length > 0,
					),
				),
			);
		} else {
			toastError(result.message);
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
									field.type === "textarea" &&
										"sm:col-span-2",
								)}
							>
								<label
									className="eyebrow block text-muted-foreground"
									htmlFor={`${definition.key}-${field.key}`}
								>
									{field.label}
								</label>
								<div className="mt-2.5">
									{field.type === "textarea" ? (
										<AdminTextarea
											id={`${definition.key}-${field.key}`}
											rows={3}
											value={values[field.key] ?? ""}
											placeholder="Using the built-in text"
											onChange={(event) =>
												setValues((previous) => ({
													...previous,
													[field.key]:
														event.target.value,
												}))
											}
										/>
									) : (
										<AdminInput
											id={`${definition.key}-${field.key}`}
											type="text"
											value={values[field.key] ?? ""}
											placeholder="Using the built-in text"
											onChange={(event) =>
												setValues((previous) => ({
													...previous,
													[field.key]:
														event.target.value,
												}))
											}
										/>
									)}
								</div>
								{field.help && (
									<p className="mt-2 text-[12px] text-muted-foreground">
										{field.help}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{definition.fields.length > 0 && (
				<div className="shrink-0 border-border border-t px-6 py-4">
					<p className="mb-3 text-[12px] text-muted-foreground">
						Leave a field blank to keep the text the site ships
						with.
					</p>
					<div className="flex flex-wrap items-center justify-end gap-2">
						<AdminButton
							onClick={() =>
								setValues(
									Object.fromEntries(
										definition.fields.map((field) => [
											field.key,
											"",
										]),
									),
								)
							}
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
