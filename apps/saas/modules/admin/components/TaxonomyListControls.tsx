"use client";

import {
	ResultCount,
	SearchField,
	TablePagination,
	TableToolbar,
} from "@admin/components/TableControls";
import { AdminSelect } from "@admin/components/ui";
import { taxonomyListParsers } from "@admin/lib/list-params";
import { debounce, useQueryStates } from "nuqs";
import { type ReactNode, useTransition } from "react";

const SEARCH_DEBOUNCE = debounce(400);

export function TaxonomyListControls({
	total,
	shown,
	page,
	pageCount,
	noun,
	canReorder,
	children,
}: {
	total: number;
	shown: number;
	page: number;
	pageCount: number;
	noun: string;
	canReorder: boolean;
	children: ReactNode;
}) {
	const [isPending, startTransition] = useTransition();
	const [params, setParams] = useQueryStates(taxonomyListParsers, {
		shallow: false,
		startTransition,
	});
	return (
		<div className="mt-6" aria-busy={isPending}>
			<TableToolbar isPending={isPending}>
				<SearchField
					label={`Search ${noun}`}
					placeholder={`Search ${noun}…`}
					value={params.q}
					isPending={isPending}
					onChange={(q) =>
						void setParams(
							{ q, page: 1 },
							{ limitUrlUpdates: SEARCH_DEBOUNCE },
						)
					}
				/>
				<AdminSelect
					className="w-auto min-w-[136px]"
					aria-label="Visibility"
					value={params.status ?? ""}
					emptyLabel="All visibility"
					options={[
						{ value: "visible", label: "Visible" },
						{ value: "hidden", label: "Hidden" },
					]}
					onValueChange={(status) =>
						void setParams({
							status:
								status === "visible" || status === "hidden"
									? status
									: null,
							page: 1,
						})
					}
				/>
				<ResultCount
					shown={shown}
					total={total}
					noun={noun}
					onClear={
						params.q || params.status
							? () =>
									void setParams({
										q: "",
										status: null,
										page: 1,
									})
							: undefined
					}
				/>
			</TableToolbar>
			{!canReorder && (
				<p className="mt-3 text-[12px] text-muted-foreground">
					Clear search and visibility filters to change the shop
					order.
				</p>
			)}
			{children}
			<TablePagination
				page={page}
				pageCount={pageCount}
				isPending={isPending}
				onPage={(nextPage) => void setParams({ page: nextPage })}
			/>
		</div>
	);
}
