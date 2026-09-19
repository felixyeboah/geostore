"use client";

import {
	reorderLandingSectionsAction,
	saveLandingSectionCopyAction,
	setLandingSectionVisibilityAction,
} from "@admin/actions/landing";
import { AdminButton, AdminInput, AdminTextarea } from "@admin/components/ui";
import type { LandingSectionDefinition } from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	EyeIcon,
	EyeOffIcon,
	LockIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

export interface LandingSectionState {
	key: string;
	isVisible: boolean;
	copy: Record<string, string>;
}

interface LandingSectionManagerProps {
	definitions: LandingSectionDefinition[];
	initial: LandingSectionState[];
}

/**
 * The landing page editor: the running order on the left, the selected
 * section's copy on the right.
 *
 * Order is changed with buttons rather than drag and drop. With fifteen bands
 * a drag is fiddly and impossible on a keyboard, and every move here is one
 * saved step that can be read back out loud.
 */
export function LandingSectionManager({
	definitions,
	initial,
}: LandingSectionManagerProps) {
	const [sections, setSections] = useState(() => orderedState(initial));
	const [selectedKey, setSelectedKey] = useState(
		() => sections[0]?.key ?? "",
	);
	const [isPending, startTransition] = useTransition();

	const byKey = new Map(definitions.map((entry) => [entry.key, entry]));
	const selected = byKey.get(selectedKey);
	const selectedState = sections.find((entry) => entry.key === selectedKey);

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;

		if (target < 0 || target >= sections.length) {
			return;
		}

		const next = [...sections];
		const [moved] = next.splice(index, 1);
		next.splice(target, 0, moved);
		setSections(next);

		startTransition(async () => {
			const result = await reorderLandingSectionsAction(
				next.map((entry) => entry.key),
			);
			if (!result.success) {
				// Put it back: the page the shopper sees did not change.
				setSections(sections);
				toastError(result.message);
			}
		});
	}

	function toggle(key: string) {
		const current = sections.find((entry) => entry.key === key);

		if (!current) {
			return;
		}

		const nextVisible = !current.isVisible;
		setSections((previous) =>
			previous.map((entry) =>
				entry.key === key
					? { ...entry, isVisible: nextVisible }
					: entry,
			),
		);

		startTransition(async () => {
			const result = await setLandingSectionVisibilityAction(
				key,
				nextVisible,
			);
			if (result.success) {
				toastSuccess(result.message);
			} else {
				setSections((previous) =>
					previous.map((entry) =>
						entry.key === key
							? { ...entry, isVisible: current.isVisible }
							: entry,
					),
				);
				toastError(result.message);
			}
		});
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14">
			<div>
				<p className="eyebrow block text-muted-foreground">
					Running order
				</p>
				<ol className="mt-4 border-border border-t">
					{sections.map((entry, index) => {
						const definition = byKey.get(entry.key);

						if (!definition) {
							return null;
						}

						const isSelected = entry.key === selectedKey;
						const hasCopy =
							Object.keys(entry.copy ?? {}).length > 0;

						return (
							<li
								key={entry.key}
								className="border-border border-b"
							>
								<div
									className={cn(
										"flex items-start gap-3 py-3 pr-1 pl-3 transition-colors",
										isSelected && "bg-muted",
									)}
								>
									<button
										type="button"
										onClick={() =>
											setSelectedKey(entry.key)
										}
										className="min-w-0 flex-1 text-left"
										aria-current={
											isSelected ? "true" : undefined
										}
									>
										<span className="flex items-center gap-2">
											<span
												className={cn(
													"truncate font-medium text-[13.5px]",
													entry.isVisible
														? "text-foreground"
														: "text-muted-foreground line-through",
												)}
											>
												{definition.name}
											</span>
											{hasCopy && (
												<span className="eyebrow shrink-0 text-[var(--ed-accent)]">
													Edited
												</span>
											)}
										</span>
										<span className="mt-1 block truncate text-[12px] text-muted-foreground">
											{definition.description}
										</span>
									</button>

									<div className="flex shrink-0 items-center">
										<button
											type="button"
											onClick={() => move(index, -1)}
											disabled={index === 0 || isPending}
											aria-label={`Move ${definition.name} up`}
											className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowUpIcon className="size-3.5" />
										</button>
										<button
											type="button"
											onClick={() => move(index, 1)}
											disabled={
												index === sections.length - 1 ||
												isPending
											}
											aria-label={`Move ${definition.name} down`}
											className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowDownIcon className="size-3.5" />
										</button>
										{definition.pinned ? (
											<span
												className="p-1.5 text-muted-foreground/50"
												title="This section is always shown"
											>
												<LockIcon className="size-3.5" />
											</span>
										) : (
											<button
												type="button"
												onClick={() =>
													toggle(entry.key)
												}
												disabled={isPending}
												aria-pressed={entry.isVisible}
												aria-label={
													entry.isVisible
														? `Hide ${definition.name}`
														: `Show ${definition.name}`
												}
												className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
											>
												{entry.isVisible ? (
													<EyeIcon className="size-3.5" />
												) : (
													<EyeOffIcon className="size-3.5" />
												)}
											</button>
										)}
									</div>
								</div>
							</li>
						);
					})}
				</ol>
				<p className="mt-4 text-[12px] text-muted-foreground leading-[1.6]">
					Arrows move a section up or down the page. The eye hides it
					from shoppers without deleting anything you have written.
				</p>
			</div>

			{selected && selectedState && (
				<LandingSectionEditor
					key={selected.key}
					definition={selected}
					copy={selectedState.copy}
					onSaved={(copy) =>
						setSections((previous) =>
							previous.map((entry) =>
								entry.key === selected.key
									? { ...entry, copy }
									: entry,
							),
						)
					}
				/>
			)}
		</div>
	);
}

function LandingSectionEditor({
	definition,
	copy,
	onSaved,
}: {
	definition: LandingSectionDefinition;
	copy: Record<string, string>;
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
		<div>
			<div className="border-border border-b pb-5">
				<h2 className="font-semibold text-[19px] text-foreground tracking-[-0.025em]">
					{definition.name}
				</h2>
				<p className="mt-2 max-w-[56ch] text-[13.5px] text-muted-foreground leading-[1.6]">
					{definition.description}
				</p>
			</div>

			{definition.fields.length === 0 ? (
				<p className="py-10 text-[13.5px] text-muted-foreground leading-[1.6]">
					This section has no editable text. You can still move it or
					hide it from the list.
				</p>
			) : (
				<>
					<div className="mt-7 grid gap-6 sm:grid-cols-2">
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

					<div className="mt-8 flex flex-wrap items-center gap-3 border-border border-t pt-6">
						<AdminButton
							variant="primary"
							onClick={save}
							disabled={!isDirty || isSaving}
						>
							{isSaving ? "Saving…" : "Save section"}
						</AdminButton>
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
						<p className="text-[12px] text-muted-foreground">
							Leave a field blank to keep the text the site ships
							with.
						</p>
					</div>
				</>
			)}
		</div>
	);
}

function orderedState(initial: LandingSectionState[]): LandingSectionState[] {
	return [...initial];
}
