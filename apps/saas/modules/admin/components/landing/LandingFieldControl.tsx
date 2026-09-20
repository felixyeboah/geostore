"use client";

import { AdminImageDropzone } from "@admin/components/AdminImageDropzone";
import { AdminInput, AdminTextarea } from "@admin/components/ui";
import {
	type LandingFieldDefinition,
	parseBrandList,
	serialiseBrandList,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

/**
 * One field of a landing band.
 *
 * Text is the band's own words. The other three store a reference — an image
 * URL, a product id, a list of brand names — which the page resolves when it
 * renders, so a featured product keeps its own price and photograph rather
 * than a stale copy of them.
 */
export function LandingFieldControl({
	sectionKey,
	field,
	value,
	onChange,
	brands,
}: {
	sectionKey: string;
	field: LandingFieldDefinition;
	value: string;
	onChange: (value: string) => void;
	/** The brands the catalogue carries, for the brand picker. */
	brands: string[];
}) {
	const id = `${sectionKey}-${field.key}`;

	if (field.type === "image") {
		return <ImageField id={id} value={value} onChange={onChange} />;
	}

	if (field.type === "product") {
		return <ProductField value={value} onChange={onChange} />;
	}

	if (field.type === "brands") {
		return <BrandField value={value} onChange={onChange} brands={brands} />;
	}

	if (field.type === "textarea") {
		return (
			<AdminTextarea
				id={id}
				rows={3}
				value={value}
				placeholder="Blank restores the built-in text"
				onChange={(event) => onChange(event.target.value)}
			/>
		);
	}

	return (
		<AdminInput
			id={id}
			type="text"
			value={value}
			placeholder="Blank restores the built-in text"
			onChange={(event) => onChange(event.target.value)}
		/>
	);
}

function ImageField({
	id,
	value,
	onChange,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
}) {
	if (value) {
		return (
			<div className="grid gap-2">
				<div className="relative aspect-[16/9] overflow-hidden rounded-[2px] border border-border bg-muted">
					{/* Unvalidated host until save, so not next/image. */}
					<img
						src={value}
						alt=""
						className="size-full object-contain"
					/>
					<button
						type="button"
						onClick={() => onChange("")}
						aria-label="Remove image"
						className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-[2px] bg-white/90 text-destructive hover:bg-white"
					>
						<XIcon className="size-4" />
					</button>
				</div>
				<AdminInput
					id={id}
					type="text"
					value={value}
					onChange={(event) => onChange(event.target.value)}
				/>
			</div>
		);
	}

	return (
		<div className="grid gap-2">
			<AdminImageDropzone
				onUploaded={([url]) => onChange(url)}
				title="Drag an image here, or click to choose"
				hint="JPG, PNG or WebP, up to 5 MB."
			/>
			<AdminInput
				id={id}
				type="text"
				placeholder="…or paste a complete image URL"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}

/**
 * Points the band at one product.
 *
 * The search runs in the database, like every other admin filter. The chosen
 * product is fetched by id alongside it, so it stays on screen while you look
 * for something else.
 */
function ProductField({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const [search, setSearch] = useState("");

	const { data, isFetching } = useQuery(
		orpc.admin.products.search.queryOptions({
			input: {
				query: search.trim() || undefined,
				ids: value ? [value] : undefined,
				limit: 8,
			},
			placeholderData: (previous) => previous,
		}),
	);

	const chosen = data?.chosen?.[0];
	const results = (data?.products ?? []).filter(
		(product) => product.id !== value,
	);

	return (
		<div className="grid gap-3">
			{chosen ? (
				<div className="flex items-center gap-3 border border-border p-2.5">
					<span className="relative size-10 shrink-0 overflow-hidden rounded-[2px] bg-muted">
						{chosen.imageUrl && (
							// Unvalidated host, so not next/image.
							<img
								src={chosen.imageUrl}
								alt=""
								className="size-full object-cover"
							/>
						)}
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate font-medium text-[13px] text-foreground">
							{chosen.name}
						</span>
						<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
							{chosen.brand} ·{" "}
							<span className="font-mono">{chosen.sku}</span>
						</span>
					</span>
					<button
						type="button"
						onClick={() => onChange("")}
						aria-label={`Remove ${chosen.name}`}
						className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
					>
						<XIcon className="size-4" />
					</button>
				</div>
			) : (
				<p className="text-[12.5px] text-muted-foreground">
					No product chosen — the band uses its shipped content.
				</p>
			)}

			<label className="relative block">
				{isFetching ? (
					<LoaderCircleIcon
						aria-hidden="true"
						className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 animate-spin text-muted-foreground"
					/>
				) : (
					<SearchIcon
						aria-hidden="true"
						className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 text-muted-foreground"
					/>
				)}
				<span className="sr-only">Search for a product</span>
				<AdminInput
					type="search"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search the catalogue"
					className="pl-9"
				/>
			</label>

			{results.length > 0 && (
				<ul className="max-h-56 overflow-y-auto border-border border-t">
					{results.map((product) => (
						<li key={product.id} className="border-border border-b">
							<button
								type="button"
								onClick={() => onChange(product.id)}
								className="flex w-full items-center gap-3 py-2 text-left transition-colors hover:text-[var(--ed-accent)]"
							>
								<span className="relative size-8 shrink-0 overflow-hidden rounded-[2px] bg-muted">
									{product.imageUrl && (
										// Unvalidated host, so not next/image.
										<img
											src={product.imageUrl}
											alt=""
											className="size-full object-cover"
										/>
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-[13px]">
										{product.name}
									</span>
									<span className="block truncate text-[12px] text-muted-foreground">
										{product.brand}
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/**
 * Chooses which brands the band names.
 *
 * The options are the brands the catalogue actually carries, so the front page
 * cannot end up advertising something the shop stopped stocking. Order is the
 * order they were picked, which is the order they appear.
 */
function BrandField({
	value,
	onChange,
	brands,
}: {
	value: string;
	onChange: (value: string) => void;
	brands: string[];
}) {
	const chosen = parseBrandList(value);

	function toggle(brand: string) {
		const next = chosen.includes(brand)
			? chosen.filter((entry) => entry !== brand)
			: [...chosen, brand];
		onChange(serialiseBrandList(next));
	}

	if (brands.length === 0) {
		return (
			<p className="text-[12.5px] text-muted-foreground">
				No brands in the catalogue yet. The band shows its shipped set.
			</p>
		);
	}

	return (
		<div className="grid gap-3">
			<div className="flex flex-wrap gap-2">
				{brands.map((brand) => {
					const isChosen = chosen.includes(brand);
					const position = chosen.indexOf(brand) + 1;
					return (
						<button
							key={brand}
							type="button"
							onClick={() => toggle(brand)}
							aria-pressed={isChosen}
							className={cn(
								"inline-flex items-center gap-1.5 border px-2.5 py-1 text-[12.5px] transition-colors",
								isChosen
									? "border-foreground text-foreground"
									: "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
							)}
						>
							{isChosen && (
								<span className="font-mono text-[10px] text-muted-foreground tabular-nums">
									{position}
								</span>
							)}
							{brand}
						</button>
					);
				})}
			</div>
			<p className="text-[12px] text-muted-foreground">
				{chosen.length === 0
					? "None chosen — the band shows the set it ships with."
					: `${chosen.length} chosen, shown in the order you picked them.`}
			</p>
		</div>
	);
}
