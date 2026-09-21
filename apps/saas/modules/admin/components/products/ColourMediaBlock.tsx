"use client";

import { ProductPhotosField } from "@admin/components/products/ProductPhotosField";
import { AdminInput } from "@admin/components/ui";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { isHexColour, optionMediaKey, optionValueHex } from "@repo/commerce";
import { cn } from "@repo/ui";

type MediaRow = ProductFormValues["optionMedia"][number];

interface ColourMediaBlockProps {
	/** Position of the option among the editor's options — for test ids. */
	optionIndex: number;
	axisName: string;
	values: string[];
	media: MediaRow[];
	/** The value whose row should be highlighted — set when its chip is clicked. */
	highlighted?: string | null;
	onPatch: (value: string, patch: Partial<MediaRow>) => void;
}

/** `#abc` → `#aabbcc`, the only form a colour input accepts. */
function toPickerHex(hex: string | undefined): string {
	if (!hex || !isHexColour(hex)) {
		return "#000000";
	}
	return hex.length === 4
		? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
		: hex;
}

/**
 * "Photos for each colour": one row per colour value with its swatch and its
 * own gallery.
 *
 * This used to live behind a click on the colour chip, and nobody could tell
 * it was there. It is a permanent block now — as soon as a colour option has
 * choices, every colour is listed with a swatch picker, its photo strip and
 * an Add photos tile, so the question "how do I add pictures for the red one"
 * answers itself.
 */
export function ColourMediaBlock({
	optionIndex,
	axisName,
	values,
	media,
	highlighted,
	onPatch,
}: ColourMediaBlockProps) {
	const lower = axisName.toLowerCase();

	return (
		<div className="rounded-[2px] border border-border bg-white">
			<div className="border-border border-b px-[18px] py-4">
				<h3 className="font-semibold text-[14px] tracking-[-0.01em]">
					Photos for each {lower}
				</h3>
				<p className="mt-1 text-[12.5px] text-muted-foreground leading-[1.55]">
					Optional. When a shopper picks a {lower}, these replace the
					main photos. Give each one a swatch so shoppers can tell
					them apart — named colours already have one.
				</p>
			</div>
			{values.map((value, valueIndex) => {
				const row = media.find(
					(entry) =>
						optionMediaKey(entry.axis, entry.value) ===
						optionMediaKey(axisName, value),
				);
				const typedHex = row?.hex ?? "";
				const shownHex = optionValueHex(media, axisName, value);
				const invalid =
					typedHex.trim() !== "" && !isHexColour(typedHex);
				return (
					<div
						key={value}
						id={`colour-media-${optionIndex}-${valueIndex}`}
						data-testid={`option-${optionIndex}-value-${valueIndex}-media`}
						className={cn(
							"grid gap-4 border-border border-b px-[18px] py-4 last:border-b-0 sm:grid-cols-[150px_180px_minmax(0,1fr)] sm:items-center",
							highlighted === value && "bg-muted/60",
						)}
					>
						<div className="flex items-center gap-2">
							<label
								className="relative size-8 shrink-0 cursor-pointer"
								title="Pick the swatch colour"
							>
								<input
									type="color"
									aria-label={`Swatch colour for ${value}`}
									className="absolute inset-0 size-full cursor-pointer opacity-0"
									value={toPickerHex(shownHex)}
									onChange={(event) =>
										onPatch(value, {
											hex: event.target.value,
										})
									}
								/>
								<span
									aria-hidden
									className={cn(
										"absolute inset-0 rounded-full border border-black/15",
										!shownHex && "border-dashed",
									)}
									style={{
										background: shownHex ?? "transparent",
									}}
								/>
							</label>
							<AdminInput
								inputSize="sm"
								aria-label="Swatch hex"
								placeholder="#1c1c1e"
								className="w-24"
								value={typedHex}
								onChange={(event) =>
									onPatch(value, {
										hex: event.target.value,
									})
								}
							/>
						</div>
						<div className="min-w-0">
							<p className="font-semibold text-[13.5px]">
								{value}
							</p>
							<p className="text-[12px] text-muted-foreground">
								{row?.images.length
									? `${row.images.length} photo${row.images.length === 1 ? "" : "s"} of its own`
									: "No photos of its own — shoppers see the main photos"}
								{invalid ? (
									<span className="text-destructive">
										{" "}
										· not a valid hex
									</span>
								) : !shownHex ? (
									<span className="text-destructive">
										{" "}
										· needs a swatch
									</span>
								) : null}
							</p>
						</div>
						<ProductPhotosField
							compact
							coverable={false}
							dropLabel="Add photos"
							value={row?.images ?? []}
							onChange={(urls) =>
								onPatch(value, { images: urls })
							}
						/>
					</div>
				);
			})}
		</div>
	);
}
