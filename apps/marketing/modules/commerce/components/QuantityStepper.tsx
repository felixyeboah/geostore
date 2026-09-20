"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

interface QuantityStepperProps {
	quantity: number;
	max: number;
	label: string;
	onChange: (quantity: number) => void;
}

export function QuantityStepper({
	quantity,
	max,
	label,
	onChange,
}: QuantityStepperProps) {
	return (
		<fieldset className="inline-flex h-9 items-center rounded-[2px] border border-border bg-transparent">
			<legend className="sr-only">Quantity for {label}</legend>
			<button
				type="button"
				onClick={() => onChange(quantity - 1)}
				disabled={quantity <= 1}
				className="flex size-9 items-center justify-center text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
				aria-label={`Decrease ${label} quantity`}
			>
				<MinusIcon className="size-3.5" strokeWidth={1.75} />
			</button>
			<span
				className="min-w-8 text-center font-medium text-[13px] text-foreground tabular-nums"
				aria-live="polite"
			>
				{quantity}
			</span>
			<button
				type="button"
				onClick={() => onChange(quantity + 1)}
				disabled={quantity >= max}
				className="flex size-9 items-center justify-center text-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
				aria-label={`Increase ${label} quantity`}
			>
				<PlusIcon className="size-3.5" strokeWidth={1.75} />
			</button>
		</fieldset>
	);
}
