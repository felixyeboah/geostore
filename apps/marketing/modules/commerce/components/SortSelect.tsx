"use client";

import {
	type CatalogueSearchParams,
	catalogueHref,
} from "@commerce/lib/catalogue";
import type { ProductSort } from "@repo/commerce";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
	{ value: "featured", label: "Featured" },
	{ value: "newest", label: "Newest first" },
	{ value: "price-asc", label: "Price, low to high" },
	{ value: "price-desc", label: "Price, high to low" },
	{ value: "rating", label: "Best rated" },
];

interface SortSelectProps {
	basePath: string;
	params: CatalogueSearchParams;
	sort: ProductSort;
}

/**
 * The editorial filter bar has no submit button, so the select navigates on
 * change. Everything else in the bar is a plain link.
 *
 * The panel carries `editorial` because Radix portals it to the body, where
 * the page wrapper's token overrides no longer reach it.
 */
export function SortSelect({ basePath, params, sort }: SortSelectProps) {
	const router = useRouter();

	return (
		<div className="flex items-center gap-2.5">
			<span className="eyebrow text-muted-foreground" id="sort-label">
				Sort
			</span>
			<Select
				value={sort}
				onValueChange={(value) =>
					router.push(
						catalogueHref(basePath, params, { sort: value }),
					)
				}
			>
				<SelectTrigger
					aria-labelledby="sort-label"
					icon={
						<ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
					}
					className="group h-auto w-auto gap-2 rounded-[2px] border-0 bg-transparent p-0 font-medium text-[13px] text-foreground shadow-none ring-offset-0 focus:ring-0 focus-visible:ring-2 focus-visible:ring-foreground/15"
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent
					align="end"
					className="editorial min-w-[200px] rounded-[2px] border-border bg-background p-1 shadow-[0_12px_40px_-12px_rgba(17,17,16,0.22)]"
				>
					{SORT_OPTIONS.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							className="cursor-pointer rounded-[2px] py-2 pr-8 pl-2.5 text-[13px] text-muted-foreground focus:bg-muted focus:text-foreground data-[state=checked]:font-medium data-[state=checked]:text-foreground"
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
