"use client";

import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib";

const Checkbox = ({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) => (
	<CheckboxPrimitive.Root
		className={cn(
			"peer size-4 shrink-0 rounded-sm border border-primary shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
			className,
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
			<CheckIcon className="size-3.5" />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
);

export { Checkbox };
