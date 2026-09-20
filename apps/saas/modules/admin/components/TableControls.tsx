"use client";

import { AdminButton, AdminInput, AdminSelect } from "@admin/components/ui";
import { cn } from "@repo/ui";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	LoaderCircleIcon,
	SearchIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * The controls above an admin table.
 *
 * They are deliberately dumb: every one of them reports a change and renders
 * what it is given. The state they edit lives in the URL and is applied by the
 * database, so the table below is whatever the server just returned rather
 * than a filtered copy of something larger held in the browser.
 */

export function TableToolbar({
	isPending,
	children,
}: {
	isPending?: boolean;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-4 gap-y-3 border-border border-b py-3.5 transition-opacity",
				// A filter change is a round trip. Fading rather than blocking
				// keeps the table readable while the next page arrives.
				isPending && "opacity-60",
			)}
		>
			{children}
		</div>
	);
}

export function SearchField({
	label,
	placeholder,
	value,
	onChange,
	isPending,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	isPending?: boolean;
}) {
	return (
		<label className="relative min-w-0 flex-1 basis-[240px]">
			{isPending ? (
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
			<span className="sr-only">{label}</span>
			<AdminInput
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="h-10 pl-9"
			/>
		</label>
	);
}

export function FacetField({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string; count: number }[];
}) {
	// A facet with nothing behind it is noise, but the one currently in force
	// has to stay listed or there would be no way to switch off a filter that
	// has narrowed the table to zero rows.
	const available = options.filter(
		(option) => option.count > 0 || option.value === value,
	);

	return (
		<label className="flex shrink-0 items-center gap-2">
			<span className="eyebrow text-muted-foreground">{label}</span>
			<AdminSelect
				size="sm"
				value={value}
				onValueChange={onChange}
				aria-label={label}
				emptyLabel="All"
				className="w-auto min-w-[136px]"
				options={available.map((option) => ({
					value: option.value,
					label: `${option.label} (${option.count})`,
				}))}
			/>
		</label>
	);
}

export function ResultCount({
	shown,
	total,
	noun,
	onClear,
}: {
	shown: number;
	total: number;
	noun: string;
	onClear?: () => void;
}) {
	return (
		// Its own group so a long row of facets wraps as a unit instead of
		// pushing the clear action off the edge.
		<div className="ml-auto flex shrink-0 items-center gap-3">
			<p className="text-[12.5px] text-muted-foreground tabular-nums">
				{shown === total
					? `${total} ${noun}`
					: `${shown} of ${total} ${noun}`}
			</p>
			{onClear && (
				<button
					type="button"
					onClick={onClear}
					className="border-border border-b pb-px text-[12.5px] text-foreground transition-colors hover:border-foreground"
				>
					Clear
				</button>
			)}
		</div>
	);
}

export function SortButton({
	children,
	active,
	dir,
	alignRight,
	onToggle,
}: {
	children: ReactNode;
	active: boolean;
	dir: "asc" | "desc";
	alignRight?: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			// `uppercase` is explicit: Tailwind's preflight strips
			// text-transform from <button>, so inheriting it from the cell
			// silently fails.
			className={cn(
				"inline-flex items-center gap-1 uppercase tracking-[inherit] transition-colors hover:text-foreground",
				alignRight && "flex-row-reverse",
				active && "text-foreground",
			)}
		>
			{children}
			{active &&
				(dir === "asc" ? (
					<ArrowUpIcon className="size-3" />
				) : (
					<ArrowDownIcon className="size-3" />
				))}
		</button>
	);
}

export function TablePagination({
	page,
	pageCount,
	isPending,
	onPage,
}: {
	page: number;
	pageCount: number;
	isPending?: boolean;
	onPage: (page: number) => void;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4 border-border border-t py-4">
			<p className="text-[12.5px] text-muted-foreground tabular-nums">
				Page {page} of {pageCount}
			</p>
			<div className="flex items-center gap-2">
				<AdminButton
					size="sm"
					onClick={() => onPage(page - 1)}
					disabled={isPending || page <= 1}
				>
					Previous
				</AdminButton>
				<AdminButton
					size="sm"
					onClick={() => onPage(page + 1)}
					disabled={isPending || page >= pageCount}
				>
					Next
				</AdminButton>
			</div>
		</div>
	);
}
