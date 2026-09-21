"use client";

import { ColourMediaBlock } from "@admin/components/products/ColourMediaBlock";
import { VariantsTable } from "@admin/components/products/VariantsTable";
import { AdminButton, AdminCombobox } from "@admin/components/ui";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import {
	COMMON_OPTION_AXES,
	isColourAxis,
	OPTION_VALUE_SUGGESTIONS,
	optionMediaKey,
	optionValueHex,
	variantAxes,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import { ImageIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

type VariantRow = ProductFormValues["variants"][number];
type MediaRow = ProductFormValues["optionMedia"][number];

/**
 * One option a shopper picks from — `{ name: "Colour", values: ["Black",
 * "White"] }`. The editor state lives here rather than in the form: variants
 * are a *projection* of the options, regenerated on every change. `id` is a
 * render key only — rows hold per-row input state, so positions cannot be
 * the key.
 */
interface OptionDraft {
	id: number;
	name: string;
	values: string[];
}

let optionId = 0;

/** Rebuild the editor's option list from stored variant attributes. */
function optionsFromVariants(variants: VariantRow[]): OptionDraft[] {
	return variantAxes(variants).map((axis) => ({
		id: ++optionId,
		name: axis.label,
		values: axis.values,
	}));
}

/** Case- and whitespace-insensitive attributes, for matching combinations. */
function normalizedAttributes(
	attributes: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(attributes ?? {})
			.map(([key, value]) => [
				key.trim().toLowerCase(),
				value.trim().toLowerCase(),
			])
			.filter(([key, value]) => key !== "" && value !== ""),
	);
}

/**
 * Every combination the current options produce, in option order — Colour ×
 * Storage lists Black × each size before White × each size. Options without
 * a name or values, and names already used by an earlier option, contribute
 * nothing.
 */
function cartesianCombos(options: OptionDraft[]): Record<string, string>[] {
	const seen = new Set<string>();
	const axes = options.filter((option) => {
		const key = option.name.trim().toLowerCase();
		if (!key || option.values.length === 0 || seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
	if (axes.length === 0) {
		return [];
	}
	let combos: Record<string, string>[] = [{}];
	for (const axis of axes) {
		const next: Record<string, string>[] = [];
		for (const combo of combos) {
			for (const value of axis.values) {
				next.push({ ...combo, [axis.name.trim()]: value });
			}
		}
		combos = next;
	}
	return combos;
}

/**
 * How well a stored variant can seed a regenerated row: 3 is an identical
 * combination, 2 means one attribute set contains the other (an axis was
 * added or removed), 1 is a partial overlap. Zero means the rows disagree on
 * a shared axis and must not share data.
 */
function donorRank(
	combo: Record<string, string>,
	attributes: Record<string, string>,
): number {
	const donorKeys = Object.keys(attributes);
	const shared = donorKeys.filter((key) => key in combo);
	if (shared.length === 0) {
		return 0;
	}
	if (shared.some((key) => attributes[key] !== combo[key])) {
		return 0;
	}
	if (
		shared.length === donorKeys.length &&
		shared.length === Object.keys(combo).length
	) {
		return 3;
	}
	if (
		shared.length === donorKeys.length ||
		shared.length === Object.keys(combo).length
	) {
		return 2;
	}
	return 1;
}

/** `256 GB` → `256GB`, `Sky Blue` → `SKYBLUE` — the SKU suffix per value. */
function valueCode(value: string): string {
	return value.toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function suggestedSku(baseSku: string, combo: Record<string, string>): string {
	return [baseSku.trim(), ...Object.values(combo).map(valueCode)]
		.filter(Boolean)
		.join("-");
}

/**
 * Rebuild the variant list from the option grid. Identical combinations keep
 * the whole stored row; near matches donate their price, stock and
 * availability to the new combinations so re-editing options never wipes
 * entered data. Variants without attributes are kept as-is at the end.
 */
function regenerateVariants(
	options: OptionDraft[],
	current: VariantRow[],
	baseSku: string,
	basePrice: number,
): VariantRow[] {
	const normalized = current.map((variant) =>
		normalizedAttributes(variant.attributes),
	);
	const claimed = new Set<number>();

	const rows = cartesianCombos(options).map((combo) => {
		const comparable = normalizedAttributes(combo);
		const exactIndex = normalized.findIndex(
			(attributes, index) =>
				!claimed.has(index) && donorRank(comparable, attributes) === 3,
		);
		if (exactIndex >= 0) {
			claimed.add(exactIndex);
			return { ...current[exactIndex], attributes: combo };
		}
		let donor: VariantRow | undefined;
		let best = 0;
		normalized.forEach((attributes, index) => {
			if (donorRank(comparable, attributes) > best) {
				best = donorRank(comparable, attributes);
				donor = current[index];
			}
		});
		return {
			name: "",
			sku: suggestedSku(baseSku, combo),
			priceInPesewas: donor?.priceInPesewas ?? basePrice,
			stockQuantity: donor?.stockQuantity ?? 0,
			attributes: combo,
			isActive: donor?.isActive ?? true,
		};
	});

	const stragglers = current.filter(
		(variant) => Object.keys(variant.attributes ?? {}).length === 0,
	);
	return [...rows, ...stragglers];
}

interface ProductOptionsEditorProps {
	form: UseFormReturn<ProductFormValues>;
}

/**
 * Options-first variant editing: the admin describes the choices a shopper
 * gets ("Colour: Black, White"), every colour gets a row in "Photos for each
 * colour", and every sellable combination materialises in the table below
 * with a suggested SKU and the starting price already filled.
 */
export function ProductOptionsEditor({ form }: ProductOptionsEditorProps) {
	const [options, setOptions] = useState<OptionDraft[]>(() => {
		const fromForm = optionsFromVariants(form.getValues("variants"));
		// A product that has just been switched to "comes in options" starts
		// with one blank row, so the first thing on screen is the thing to do.
		return fromForm.length
			? fromForm
			: [{ id: ++optionId, name: "", values: [] }];
	});
	const [highlighted, setHighlighted] = useState<{
		option: number;
		value: string;
	} | null>(null);
	const watchedVariants = form.watch("variants");
	const watchedMedia = form.watch("optionMedia") ?? [];
	const baseSku = form.watch("sku");
	const basePrice = form.watch("priceInPesewas");

	// A successful save resets the form — rebuild the editor from whatever
	// variants came back.
	const submitted = form.formState.isSubmitSuccessful;
	useEffect(() => {
		if (submitted) {
			const next = optionsFromVariants(form.getValues("variants"));
			optionsRef.current = next;
			setOptions(next);
		}
	}, [submitted, form]);

	// Every edit is computed from the latest options, not from the options
	// of the render that created the handler. Two quick edits — typing a
	// choice and pressing Enter twice — otherwise race the heavy re-render of
	// the whole form, and the second edit silently drops the first.
	const optionsRef = useRef(options);
	const applyOptions = (
		update: (previous: OptionDraft[]) => OptionDraft[],
	) => {
		const next = update(optionsRef.current);
		optionsRef.current = next;
		setOptions(next);
		form.setValue(
			"variants",
			regenerateVariants(
				next,
				form.getValues("variants"),
				baseSku,
				basePrice,
			),
			{ shouldDirty: true },
		);
	};

	const addOption = () =>
		applyOptions((previous) => [
			...previous,
			{ id: ++optionId, name: "", values: [] },
		]);

	const renameOption = (index: number, name: string) => {
		const from = (optionsRef.current[index]?.name ?? "")
			.trim()
			.toLowerCase();
		const to = name.trim().toLowerCase();
		if (from && to && from !== to) {
			// Retag stored rows before regenerating so the rename keeps
			// every combination's data and media.
			form.setValue(
				"variants",
				form.getValues("variants").map((variant) => {
					const attributes = variant.attributes ?? {};
					if (
						!Object.keys(attributes).some(
							(key) => key.trim().toLowerCase() === from,
						)
					) {
						return variant;
					}
					return {
						...variant,
						attributes: Object.fromEntries(
							Object.entries(attributes).map(([key, value]) => [
								key.trim().toLowerCase() === from
									? name.trim()
									: key,
								value,
							]),
						),
					};
				}),
			);
			form.setValue(
				"optionMedia",
				(form.getValues("optionMedia") ?? []).map((media) =>
					media.axis.trim().toLowerCase() === from
						? { ...media, axis: name.trim() }
						: media,
				),
			);
		}
		applyOptions((previous) =>
			previous.map((option, i) =>
				i === index ? { ...option, name } : option,
			),
		);
	};

	const removeOption = (index: number) => {
		const option = optionsRef.current[index];
		if (
			option.values.length > 0 &&
			!window.confirm(
				`Remove "${option.name || "this option"}" and its ${option.values.length} choice${option.values.length === 1 ? "" : "s"}? The combinations that used it are merged.`,
			)
		) {
			return;
		}
		applyOptions((previous) => previous.filter((_, i) => i !== index));
	};

	const addValue = (index: number, raw: string): boolean => {
		const value = raw.trim();
		const option = optionsRef.current[index];
		if (
			!value ||
			option.values.some((v) => v.toLowerCase() === value.toLowerCase())
		) {
			return false;
		}
		applyOptions((previous) =>
			previous.map((o, i) =>
				i === index ? { ...o, values: [...o.values, value] } : o,
			),
		);
		return true;
	};

	// The removed value's media row stays — re-adding the value brings its
	// swatch and photos straight back.
	const removeValue = (index: number, valueIndex: number) =>
		applyOptions((previous) =>
			previous.map((o, i) =>
				i === index
					? {
							...o,
							values: o.values.filter((_, j) => j !== valueIndex),
						}
					: o,
			),
		);

	const patchMedia = (
		axis: string,
		value: string,
		patch: Partial<MediaRow>,
	) => {
		const key = optionMediaKey(axis, value);
		const rows = [...(form.getValues("optionMedia") ?? [])];
		const index = rows.findIndex(
			(media) => optionMediaKey(media.axis, media.value) === key,
		);
		if (index >= 0) {
			rows[index] = { ...rows[index], ...patch };
		} else {
			rows.push({
				axis: axis.trim(),
				value,
				hex: "",
				images: [],
				...patch,
			});
		}
		form.setValue("optionMedia", rows, { shouldDirty: true });
	};

	const jumpToColour = (index: number, value: string) => {
		setHighlighted({ option: index, value });
		const valueIndex = options[index].values.indexOf(value);
		document
			.getElementById(`colour-media-${index}-${valueIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" });
	};

	const usedNames = options.map((option) => option.name.trim().toLowerCase());
	const colourOptions = options
		.map((option, index) => ({ option, index }))
		.filter(
			({ option }) =>
				option.name.trim() !== "" &&
				isColourAxis(option.name) &&
				option.values.length > 0,
		);

	return (
		<div className="grid gap-7">
			<div>
				<div className="divide-y divide-border border-border border-y">
					{options.map((option, index) => (
						<OptionRow
							key={option.id}
							index={index}
							option={option}
							siblingNames={usedNames.filter(
								(_, i) => i !== index,
							)}
							media={watchedMedia}
							highlightedValue={
								highlighted?.option === index
									? highlighted.value
									: null
							}
							onRename={(name) => renameOption(index, name)}
							onRemove={() => removeOption(index)}
							onAddValue={(value) => addValue(index, value)}
							onRemoveValue={(valueIndex) =>
								removeValue(index, valueIndex)
							}
							onJumpToColour={(value) =>
								jumpToColour(index, value)
							}
						/>
					))}
				</div>
				<div className="mt-3.5 flex flex-wrap items-center gap-3">
					<AdminButton size="sm" onClick={addOption}>
						<PlusIcon className="size-4" />{" "}
						{options.length
							? "Add another option"
							: "Add an option"}
					</AdminButton>
					<span className="text-[12.5px] text-muted-foreground">
						{options.length
							? "Storage, material, strap…"
							: "Colour, size, storage — the things a shopper picks between."}
					</span>
				</div>
			</div>

			{colourOptions.map(({ option, index }) => (
				<ColourMediaBlock
					key={option.id}
					optionIndex={index}
					axisName={option.name.trim()}
					values={option.values}
					media={watchedMedia}
					highlighted={
						highlighted?.option === index ? highlighted.value : null
					}
					onPatch={(value, patch) =>
						patchMedia(option.name, value, patch)
					}
				/>
			))}

			{watchedVariants.length > 0 ? (
				<VariantsTable form={form} />
			) : (
				<p className="rounded-[2px] border border-border border-dashed p-4 text-[13px] text-muted-foreground">
					{options.some((option) => option.name.trim())
						? "Give each option at least one choice and every sellable combination appears here with its own SKU, price and stock."
						: "Name an option and add its choices — every combination appears here with its own SKU, price and stock."}
				</p>
			)}
		</div>
	);
}

interface OptionRowProps {
	index: number;
	option: OptionDraft;
	/** Lowercased names of the other options — for suggestions and the duplicate warning. */
	siblingNames: string[];
	media: MediaRow[];
	highlightedValue: string | null;
	onRename: (name: string) => void;
	onRemove: () => void;
	onAddValue: (value: string) => boolean;
	onRemoveValue: (valueIndex: number) => void;
	onJumpToColour: (value: string) => void;
}

/** One option: its name and the choices a shopper picks between. */
function OptionRow({
	index,
	option,
	siblingNames,
	media,
	highlightedValue,
	onRename,
	onRemove,
	onAddValue,
	onRemoveValue,
	onJumpToColour,
}: OptionRowProps) {
	const [pending, setPending] = useState("");
	const isColour = option.name.trim() !== "" && isColourAxis(option.name);
	const isDuplicate =
		option.name.trim() !== "" &&
		siblingNames.includes(option.name.trim().toLowerCase());
	const nameSuggestions = COMMON_OPTION_AXES.filter(
		(axis) => !siblingNames.includes(axis.toLowerCase()),
	);
	const quickValues = (
		OPTION_VALUE_SUGGESTIONS[option.name.trim().toLowerCase()] ?? []
	)
		.filter(
			(value) =>
				!option.values.some(
					(existing) =>
						existing.toLowerCase() === value.toLowerCase(),
				),
		)
		.slice(0, 6);

	const commitPending = () => {
		if (pending.trim() && onAddValue(pending)) {
			setPending("");
		} else if (!pending.trim()) {
			setPending("");
		}
	};

	return (
		<div
			data-testid={`option-${index}`}
			className="grid gap-4 py-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-start"
		>
			<div>
				<p className="eyebrow mb-2 flex h-5 items-center text-muted-foreground">
					Option {index + 1}
				</p>
				<AdminCombobox
					aria-label="Option name"
					placeholder="Colour, Size, Storage…"
					value={option.name}
					suggestions={nameSuggestions}
					aria-invalid={isDuplicate || undefined}
					onValueChange={onRename}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							(
								event.currentTarget
									.closest("[data-testid]")
									?.querySelector(
										'input[aria-label="Option values"]',
									) as HTMLInputElement | null
							)?.focus();
						}
					}}
				/>
				{isDuplicate && (
					<p className="mt-2 text-[12px] text-destructive">
						Another option already has this name.
					</p>
				)}
			</div>

			<div className="min-w-0">
				<p className="mb-2 flex h-5 items-center gap-2 font-medium text-[13px]">
					Choices
					<span className="font-normal text-[12px] text-muted-foreground/80">
						{option.values.length === 0
							? "type one, press Enter"
							: isColour
								? `${option.values.length} · swatches and photos are set below`
								: option.values.length}
					</span>
				</p>
				<div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-[2px] border border-border bg-white p-1.5 focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
					{option.values.map((value, valueIndex) => {
						const row = media.find(
							(m) =>
								optionMediaKey(m.axis, m.value) ===
								optionMediaKey(option.name, value),
						);
						const hex = isColour
							? optionValueHex(media, option.name, value)
							: undefined;
						const inner = (
							<>
								{isColour && (
									<span
										aria-hidden
										className={cn(
											"size-3 rounded-full border border-black/15",
											!hex && "border-dashed",
										)}
										style={{
											backgroundColor:
												hex ?? "transparent",
										}}
									/>
								)}
								{value}
								{(row?.images.length ?? 0) > 0 && (
									<span className="inline-flex items-center gap-0.5 text-[10.5px] text-muted-foreground">
										<ImageIcon className="size-3" />
										{row?.images.length}
									</span>
								)}
							</>
						);
						return (
							<span
								key={value}
								className={cn(
									"inline-flex h-[30px] items-center whitespace-nowrap rounded-[2px] border bg-background text-[13px]",
									highlightedValue === value
										? "border-foreground"
										: "border-border",
								)}
							>
								{isColour ? (
									<button
										type="button"
										aria-label={value}
										title="Go to this colour's photos"
										onClick={() => onJumpToColour(value)}
										className="inline-flex h-full items-center gap-1.5 pr-1 pl-2.5 hover:text-foreground"
									>
										{inner}
									</button>
								) : (
									<span className="inline-flex h-full items-center gap-1.5 pr-1 pl-2.5">
										{inner}
									</span>
								)}
								<button
									type="button"
									aria-label={`Remove ${value}`}
									onClick={() => onRemoveValue(valueIndex)}
									className="px-1.5 text-[15px] text-muted-foreground leading-none hover:text-destructive"
								>
									×
								</button>
							</span>
						);
					})}
					<input
						aria-label="Option values"
						className="h-[30px] min-w-36 flex-1 bg-transparent px-1.5 text-[13px] outline-none placeholder:text-muted-foreground/60"
						placeholder={
							option.values.length
								? "Add another…"
								: quickValues.length
									? `e.g. ${quickValues.slice(0, 2).join(", ")}`
									: "e.g. Jet Black"
						}
						value={pending}
						onChange={(event) => setPending(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === ",") {
								event.preventDefault();
								commitPending();
							} else if (
								event.key === "Backspace" &&
								!pending &&
								option.values.length > 0
							) {
								onRemoveValue(option.values.length - 1);
							}
						}}
						onBlur={commitPending}
					/>
				</div>
				{quickValues.length > 0 && (
					<div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
						Quick add:
						{quickValues.map((value) => (
							<button
								key={value}
								type="button"
								onClick={() => onAddValue(value)}
								className="rounded-[2px] border border-border px-2 py-0.5 text-[12px] text-muted-foreground hover:border-foreground hover:text-foreground"
							>
								{value}
							</button>
						))}
					</div>
				)}
			</div>

			<button
				type="button"
				aria-label={`Remove option ${index + 1}`}
				title="Remove option"
				onClick={onRemove}
				className="mt-7 flex h-11 items-center text-muted-foreground/70 hover:text-destructive"
			>
				<Trash2Icon className="size-4" />
			</button>
		</div>
	);
}
