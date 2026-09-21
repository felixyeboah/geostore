"use client";

import { cn } from "@repo/ui";
import { CheckIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import * as React from "react";
import {
	CONTROL_BASE,
	CONTROL_SIZES,
	type ControlSize,
} from "./control-styles";

export interface AdminComboboxProps
	extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "size"> {
	value: string;
	onValueChange: (value: string) => void;
	/** Common picks shown under the input; anything typed still counts. */
	suggestions: string[];
	inputSize?: ControlSize;
}

/**
 * A text input with a suggestion list — the REUI autocomplete shape: the
 * field stays free-form, and the popover only offers values rather than
 * restricting to them.
 *
 * Arrow keys move through the list, Enter picks the highlighted suggestion,
 * Escape closes it, and clicking an option does the same. The popover is
 * non-modal so focus never leaves the input while typing.
 */
export function AdminCombobox({
	value,
	onValueChange,
	suggestions,
	inputSize = "md",
	className,
	placeholder,
	onKeyDown,
	...props
}: AdminComboboxProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [open, setOpen] = React.useState(false);
	const [highlighted, setHighlighted] = React.useState(0);
	const listId = React.useId();

	// An exact match means the admin finished — offering the same word back
	// would only cover whatever they are about to type next.
	const filtered = suggestions.filter(
		(suggestion) =>
			suggestion.toLowerCase().includes(value.toLowerCase()) &&
			suggestion.toLowerCase() !== value.toLowerCase(),
	);
	const showList = open && filtered.length > 0;

	const pick = (suggestion: string) => {
		onValueChange(suggestion);
		setOpen(false);
		inputRef.current?.focus();
	};

	return (
		<PopoverPrimitive.Root
			open={showList}
			onOpenChange={setOpen}
			modal={false}
		>
			<PopoverPrimitive.Anchor asChild>
				<input
					ref={inputRef}
					role="combobox"
					aria-expanded={showList}
					aria-controls={listId}
					aria-autocomplete="list"
					autoComplete="off"
					className={cn(
						CONTROL_BASE,
						CONTROL_SIZES[inputSize],
						className,
					)}
					placeholder={placeholder}
					value={value}
					onChange={(event) => {
						onValueChange(event.target.value);
						setHighlighted(0);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onKeyDown={(event) => {
						if (showList) {
							if (event.key === "ArrowDown") {
								event.preventDefault();
								setHighlighted(
									(index) => (index + 1) % filtered.length,
								);
								return;
							}
							if (event.key === "ArrowUp") {
								event.preventDefault();
								setHighlighted(
									(index) =>
										(index - 1 + filtered.length) %
										filtered.length,
								);
								return;
							}
							if (event.key === "Enter") {
								event.preventDefault();
								pick(filtered[highlighted] ?? filtered[0]);
								return;
							}
							if (event.key === "Escape") {
								setOpen(false);
								return;
							}
						}
						onKeyDown?.(event);
					}}
					{...props}
				/>
			</PopoverPrimitive.Anchor>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					align="start"
					sideOffset={4}
					// Focus stays in the input; options are picked by keyboard
					// or click without stealing it.
					onOpenAutoFocus={(event) => event.preventDefault()}
					className="editorial z-50 max-h-56 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-[2px] border border-border bg-background p-1 shadow-[0_12px_40px_-12px_rgba(17,17,16,0.22)]"
				>
					<div id={listId} role="listbox">
						{filtered.map((suggestion, index) => (
							<button
								key={suggestion}
								type="button"
								role="option"
								aria-selected={index === highlighted}
								// onMouseDown fires before the input blurs,
								// so the popover cannot close under the click.
								onMouseDown={(event) => {
									event.preventDefault();
									pick(suggestion);
								}}
								onMouseEnter={() => setHighlighted(index)}
								className={cn(
									"flex w-full cursor-pointer items-center justify-between rounded-[2px] py-2 pr-2.5 pl-2.5 text-left text-[13px] text-muted-foreground",
									index === highlighted &&
										"bg-muted text-foreground",
								)}
							>
								{suggestion}
								{index === highlighted && (
									<CheckIcon className="size-3.5" />
								)}
							</button>
						))}
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
