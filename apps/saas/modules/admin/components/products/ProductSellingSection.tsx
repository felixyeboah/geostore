"use client";

import { Lbl, Section } from "@admin/components/products/form-primitives";
import { ProductOptionsEditor } from "@admin/components/products/ProductOptionsEditor";
import type { SoldAs } from "@admin/components/products/product-readiness";
import { AdminInput } from "@admin/components/ui";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { cn } from "@repo/ui";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@repo/ui/components/form";
import type { UseFormReturn } from "react-hook-form";

interface ProductSellingSectionProps {
	form: UseFormReturn<ProductFormValues>;
	soldAs: SoldAs;
	onSoldAsChange: (soldAs: SoldAs) => void;
	/** Stock across combinations on sale — the figure list filters read. */
	activeStock: number;
}

/**
 * How the product is sold: one version with a single price and stock count,
 * or a set of options whose combinations carry their own. Switching between
 * the two keeps everything already typed.
 */
export function ProductSellingSection({
	form,
	soldAs,
	onSoldAsChange,
	activeStock,
}: ProductSellingSectionProps) {
	const variants = form.watch("variants");

	return (
		<Section
			id="selling"
			title="How is it sold?"
			lede="Does a shopper have to choose anything — a colour, a size — before buying? You can change your mind without losing what you typed."
		>
			<div
				role="radiogroup"
				aria-label="How is it sold"
				className="grid gap-3 sm:grid-cols-2"
			>
				{(
					[
						{
							value: "single",
							title: "One version",
							detail: "A single price and a single stock count. Most accessories, cables and cases.",
						},
						{
							value: "options",
							title: "Comes in options",
							detail: "Colour, size, storage… Each combination gets its own price, stock and SKU.",
						},
					] as const
				).map((choice) => {
					const on = soldAs === choice.value;
					return (
						<label
							key={choice.value}
							className={cn(
								"relative flex cursor-pointer items-start gap-3 rounded-[2px] border bg-white p-4 text-left transition-colors focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 hover:border-foreground",
								on
									? "border-foreground ring-1 ring-foreground"
									: "border-border",
							)}
						>
							<input
								type="radio"
								name="soldAs"
								value={choice.value}
								checked={on}
								onChange={() => onSoldAsChange(choice.value)}
								className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
							/>
							<span
								aria-hidden
								className={cn(
									"mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
									on ? "border-foreground" : "border-border",
								)}
							>
								{on && (
									<span className="size-2 rounded-full bg-foreground" />
								)}
							</span>
							<span>
								<span className="block font-semibold text-[13.5px]">
									{choice.title}
								</span>
								<span className="mt-0.5 block text-[12.5px] text-muted-foreground leading-[1.5]">
									{choice.detail}
								</span>
							</span>
						</label>
					);
				})}
			</div>

			<div className="grid gap-5 sm:grid-cols-3">
				<FormField
					control={form.control}
					name="priceInPesewas"
					render={({ field }) => (
						<FormItem>
							<Lbl required>
								{soldAs === "options"
									? "Starting price (GH₵)"
									: "Price (GH₵)"}
							</Lbl>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="0.01"
									placeholder="0.00"
									className="tabular-nums"
									name={field.name}
									value={field.value ? field.value / 100 : ""}
									onChange={(event) =>
										field.onChange(
											Math.round(
												Number(event.target.value) *
													100,
											),
										)
									}
								/>
							</FormControl>
							{soldAs === "options" && (
								<p className="text-[12px] text-muted-foreground">
									Every combination begins here.
								</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>
				{soldAs === "single" && (
					<FormField
						control={form.control}
						name="compareAtInPesewas"
						render={({ field }) => (
							<FormItem>
								<Lbl hint="optional">Was price (GH₵)</Lbl>
								<FormControl>
									<AdminInput
										type="number"
										min="0"
										step="0.01"
										placeholder="0.00"
										className="tabular-nums"
										name={field.name}
										value={
											field.value ? field.value / 100 : ""
										}
										onChange={(event) =>
											field.onChange(
												event.target.value
													? Math.round(
															Number(
																event.target
																	.value,
															) * 100,
														)
													: undefined,
											)
										}
									/>
								</FormControl>
								<p className="text-[12px] text-muted-foreground">
									Shown struck through beside the price.
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="sku"
					render={({ field }) => (
						<FormItem>
							<Lbl required>
								{soldAs === "options"
									? "Base product code (SKU)"
									: "Product code (SKU)"}
							</Lbl>
							<FormControl>
								<AdminInput
									placeholder="GST-APL-AWS11"
									className="tabular-nums"
									{...field}
								/>
							</FormControl>
							{soldAs === "options" && (
								<p className="text-[12px] text-muted-foreground">
									Combinations add their own suffix.
								</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>
				{soldAs === "single" && (
					<FormField
						control={form.control}
						name="stockQuantity"
						render={({ field }) => (
							<FormItem>
								<Lbl required>In stock</Lbl>
								<FormControl>
									<AdminInput
										type="number"
										min="0"
										step="1"
										className="tabular-nums"
										{...field}
										onChange={(event) =>
											field.onChange(
												Number(event.target.value),
											)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="lowStockThreshold"
					render={({ field }) => (
						<FormItem>
							<Lbl>Low-stock warning at</Lbl>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="1"
									className="tabular-nums"
									{...field}
									onChange={(event) =>
										field.onChange(
											Number(event.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{soldAs === "options" && (
				<>
					<ProductOptionsEditor form={form} />
					{variants.length > 0 && (
						<p className="text-[12px] text-muted-foreground tabular-nums">
							Stock across combinations on sale:{" "}
							<b className="text-foreground">{activeStock}</b>.
							That is the figure the product list and low-stock
							warnings use.
						</p>
					)}
				</>
			)}
		</Section>
	);
}
