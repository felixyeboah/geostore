"use client";

import { cn } from "@repo/ui";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { ChevronDownIcon } from "lucide-react";

export interface AdminSelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface AdminSelectProps {
	options: AdminSelectOption[];
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Shown when nothing is chosen. */
	placeholder?: string;
	/**
	 * Adds a first item that clears the choice, e.g. "All". Radix refuses an
	 * item with an empty value, so it is carried as a sentinel and handed back
	 * to the caller as an empty string.
	 */
	emptyLabel?: string;
	size?: "sm" | "md";
	name?: string;
	id?: string;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
}

const EMPTY = "__empty__";

const TRIGGER_SIZES = {
	sm: "h-9 px-2.5 text-[12.5px]",
	md: "h-11 px-3.5 text-[14px]",
} as const;

/**
 * The admin's select.
 *
 * This was a native `<select>`, which meant the open list was drawn by the
 * operating system — a grey rounded panel with a system-blue highlight that
 * belonged to nothing else on the page. A listbox is the only way to control
 * what the open state looks like.
 *
 * The panel carries `editorial` because Radix portals it to `<body>`, where
 * the admin layout's token overrides no longer reach it.
 */
export function AdminSelect({
	options,
	value,
	defaultValue,
	onValueChange,
	placeholder,
	emptyLabel,
	size = "md",
	name,
	id,
	disabled,
	className,
	"aria-label": ariaLabel,
}: AdminSelectProps) {
	const toRadix = (raw?: string) =>
		raw === undefined || raw === "" ? undefined : raw;

	return (
		<Select
			name={name}
			disabled={disabled}
			value={value === undefined ? undefined : (toRadix(value) ?? EMPTY)}
			defaultValue={toRadix(defaultValue)}
			onValueChange={(next) =>
				onValueChange?.(next === EMPTY ? "" : next)
			}
		>
			<SelectTrigger
				id={id}
				aria-label={ariaLabel}
				icon={
					<ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
				}
				className={cn(
					"group w-full gap-2 rounded-[2px] border border-border bg-transparent text-foreground shadow-none transition-colors focus:ring-0 focus-visible:border-foreground focus-visible:outline-none data-[placeholder]:text-muted-foreground",
					TRIGGER_SIZES[size],
					className,
				)}
			>
				<SelectValue placeholder={placeholder ?? emptyLabel} />
			</SelectTrigger>
			<SelectContent
				align="start"
				className="editorial min-w-[var(--radix-select-trigger-width)] rounded-[2px] border-border bg-background p-1 shadow-[0_12px_40px_-12px_rgba(17,17,16,0.22)]"
			>
				{emptyLabel && (
					<SelectItem value={EMPTY} className={ITEM_CLASS}>
						{emptyLabel}
					</SelectItem>
				)}
				{options.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						disabled={option.disabled}
						className={ITEM_CLASS}
					>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

const ITEM_CLASS =
	"cursor-pointer rounded-[2px] py-2 pr-8 pl-2.5 text-[13px] text-muted-foreground focus:bg-muted focus:text-foreground data-[state=checked]:font-medium data-[state=checked]:text-foreground";
