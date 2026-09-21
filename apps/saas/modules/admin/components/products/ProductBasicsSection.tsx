"use client";

import { Lbl, Section } from "@admin/components/products/form-primitives";
import {
	AdminButton,
	AdminInput,
	AdminSelect,
	AdminTextarea,
} from "@admin/components/ui";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { cn } from "@repo/ui";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

interface ProductBasicsSectionProps {
	form: UseFormReturn<ProductFormValues>;
	categories: Array<{ id: string; name: string }>;
	/** Follows the name into the slug field while the slug is still automatic. */
	onNameInput: (name: string) => void;
}

/**
 * What the product is: name and shop address, where it belongs, and the two
 * pieces of copy a shopper reads. The slug shows as the address it will live
 * at and only turns into a field when the admin asks to change it.
 */
export function ProductBasicsSection({
	form,
	categories,
	onNameInput,
}: ProductBasicsSectionProps) {
	const [editingSlug, setEditingSlug] = useState(false);

	return (
		<Section id="basics" title="Basics">
			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<Lbl required>Name</Lbl>
						<FormControl>
							<AdminInput
								placeholder="e.g. Apple Watch Series 11"
								{...field}
								onChange={(event) => {
									field.onChange(event);
									onNameInput(event.target.value);
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="slug"
				render={({ field }) => (
					<FormItem className="-mt-2">
						{editingSlug ? (
							<div className="flex flex-wrap items-center gap-2">
								<FormLabel className="sr-only">
									URL slug
								</FormLabel>
								<span className="text-[12.5px] text-muted-foreground">
									/products/
								</span>
								<FormControl>
									<AdminInput
										inputSize="sm"
										className="w-72 tabular-nums"
										placeholder="apple-watch-series-11"
										{...field}
									/>
								</FormControl>
								<AdminButton
									size="sm"
									onClick={() => setEditingSlug(false)}
								>
									Done
								</AdminButton>
							</div>
						) : (
							<p className="text-[12.5px] text-muted-foreground">
								Shop address: /products/
								<b className="text-foreground tabular-nums">
									{field.value || "…"}
								</b>
								{" · "}
								<button
									type="button"
									onClick={() => setEditingSlug(true)}
									className="underline underline-offset-[3px] hover:text-foreground"
								>
									Change
								</button>
							</p>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className="grid gap-5 sm:grid-cols-3">
				<FormField
					control={form.control}
					name="brand"
					render={({ field }) => (
						<FormItem>
							<Lbl required>Brand</Lbl>
							<FormControl>
								<AdminInput placeholder="Apple" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="categoryId"
					render={({ field }) => (
						<FormItem>
							<Lbl required>Department</Lbl>
							<FormControl>
								<AdminSelect
									value={field.value}
									onValueChange={field.onChange}
									placeholder="Choose…"
									aria-label="Department"
									options={categories.map((category) => ({
										value: category.id,
										label: category.name,
									}))}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="condition"
					render={({ field }) => (
						<FormItem>
							<Lbl>Condition</Lbl>
							<FormControl>
								<AdminSelect
									value={field.value}
									onValueChange={field.onChange}
									aria-label="Condition"
									options={[
										{ value: "NEW", label: "New" },
										{
											value: "REFURBISHED",
											label: "Refurbished",
										},
										{ value: "USED", label: "Used" },
									]}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
			<FormField
				control={form.control}
				name="shortDescription"
				render={({ field }) => (
					<FormItem>
						<Lbl required hint="one line, shown on product cards">
							Summary
						</Lbl>
						<FormControl>
							<AdminInput
								placeholder="One sentence a shopper reads on the card"
								maxLength={200}
								{...field}
							/>
						</FormControl>
						<p
							className={cn(
								"text-[12px] tabular-nums",
								field.value.length > 180
									? "text-destructive"
									: "text-muted-foreground",
							)}
						>
							{field.value.length} / 180
						</p>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<Lbl required>Description</Lbl>
						<FormControl>
							<AdminTextarea
								rows={6}
								placeholder="What should a customer know before buying?"
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</Section>
	);
}
