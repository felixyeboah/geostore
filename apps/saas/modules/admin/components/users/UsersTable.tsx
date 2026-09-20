"use client";

import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import {
	FacetField,
	ResultCount,
	SearchField,
	SortButton,
	TablePagination,
	TableToolbar,
} from "@admin/components/TableControls";
import { AdminButton } from "@admin/components/ui";
import {
	AddUserButton,
	AddUserSheet,
} from "@admin/components/users/AddUserSheet";
import {
	type UserRow,
	UserRowActions,
} from "@admin/components/users/UserRowActions";
import { userListParsers } from "@admin/lib/list-params";
import { formatRelativeTime } from "@admin/lib/overview";
import { useSession } from "@auth/hooks/use-session";
import { cn, Spinner } from "@repo/ui";
import { UserAvatar } from "@shared/components/UserAvatar";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce, useQueryStates } from "nuqs";
import { useTransition } from "react";

const ROLE_LABELS = { admin: "Admin", user: "User" } as const;
const STATUS_LABELS = {
	active: "Active",
	banned: "Banned",
	unverified: "Unverified",
} as const;

const SEARCH_DEBOUNCE = debounce(400);

/**
 * The people who can sign in.
 *
 * Every row is staff: this shop has no customer accounts. The list is driven
 * from the URL and filtered by the database, like the catalogue and the order
 * book — the previous one paged in the browser over a fixed ten rows.
 */
export function UsersTable() {
	const { user: signedInUser } = useSession();
	const queryClient = useQueryClient();
	const [isNavigating, startNavigation] = useTransition();

	const [params, setParams] = useQueryStates(userListParsers, {
		startTransition: startNavigation,
	});

	const { data, isPending, isFetching } = useQuery(
		orpc.admin.users.adminList.queryOptions({
			input: {
				query: params.q.trim() || undefined,
				role: params.role ?? undefined,
				status: params.status ?? undefined,
				sort: params.sort,
				dir: params.dir,
				page: params.page,
			},
			placeholderData: (previous) => previous,
		}),
	);

	function refresh() {
		void queryClient.invalidateQueries({
			queryKey: orpc.admin.users.adminList.key(),
		});
	}

	function sortBy(sort: "created" | "name") {
		const dir =
			params.sort === sort && params.dir === "desc" ? "asc" : "desc";
		void setParams({ sort, dir, page: 1 });
	}

	const users = (data?.users ?? []) as UserRow[];
	const facets = data?.facets;
	const busy = isFetching || isNavigating;

	const hasFilters = Boolean(params.q.trim() || params.role || params.status);

	function clearFilters() {
		void setParams({ q: "", role: null, status: null, page: 1 });
	}

	return (
		<div>
			<TableToolbar isPending={busy}>
				<SearchField
					label="Search users"
					placeholder="Search by name or email"
					value={params.q}
					isPending={busy}
					onChange={(value) =>
						void setParams(
							{ q: value, page: 1 },
							{ limitUrlUpdates: SEARCH_DEBOUNCE },
						)
					}
				/>

				<FacetField
					label="Role"
					value={params.role ?? ""}
					onChange={(value) =>
						void setParams({
							role: (value || null) as "admin" | "user" | null,
							page: 1,
						})
					}
					options={(["admin", "user"] as const).map((value) => ({
						value,
						label: ROLE_LABELS[value],
						count: facets?.role[value] ?? 0,
					}))}
				/>

				<FacetField
					label="Status"
					value={params.status ?? ""}
					onChange={(value) =>
						void setParams({
							status: (value || null) as
								| "active"
								| "banned"
								| "unverified"
								| null,
							page: 1,
						})
					}
					options={(["active", "banned", "unverified"] as const).map(
						(value) => ({
							value,
							label: STATUS_LABELS[value],
							count: facets?.status[value] ?? 0,
						}),
					)}
				/>

				<ResultCount
					shown={users.length}
					total={data?.total ?? 0}
					noun="users"
					onClear={hasFilters ? clearFilters : undefined}
				/>
			</TableToolbar>

			{isPending ? (
				<div className="flex justify-center py-16">
					<Spinner className="size-5 text-muted-foreground" />
				</div>
			) : (
				<>
					<div
						className={cn(
							"overflow-x-auto transition-opacity",
							busy && "opacity-60",
						)}
					>
						<table className="w-full border-collapse text-left">
							<thead>
								<tr>
									<th className={ADMIN_TH}>
										<SortButton
											active={params.sort === "name"}
											dir={params.dir}
											onToggle={() => sortBy("name")}
										>
											Person
										</SortButton>
									</th>
									<th className={ADMIN_TH}>Role</th>
									<th className={ADMIN_TH}>Status</th>
									<th className={cn(ADMIN_TH, "text-right")}>
										Activity
									</th>
									<th className={cn(ADMIN_TH, "text-right")}>
										<SortButton
											active={params.sort === "created"}
											dir={params.dir}
											alignRight
											onToggle={() => sortBy("created")}
										>
											Joined
										</SortButton>
									</th>
									<th className={cn(ADMIN_TH, "text-right")}>
										<span className="sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => {
									const isSelf = user.id === signedInUser?.id;
									return (
										<tr key={user.id}>
											<td
												className={cn(
													ADMIN_TD,
													// A banned account carries
													// an ink edge rather than
													// a coloured row.
													user.banned &&
														"border-l-2 border-l-foreground",
												)}
											>
												<div className="flex min-w-[240px] items-center gap-3.5">
													<UserAvatar
														className="size-9 shrink-0"
														avatarUrl={user.image}
														name={
															user.name ||
															user.email
														}
													/>
													<span className="min-w-0">
														<span className="flex items-center gap-2">
															<span className="truncate font-medium text-[13.5px] text-foreground">
																{user.name ||
																	"—"}
															</span>
															{isSelf && (
																<span className="eyebrow shrink-0 text-muted-foreground">
																	You
																</span>
															)}
														</span>
														<span className="mt-1 block truncate text-[12px] text-muted-foreground">
															{user.email}
														</span>
													</span>
												</div>
											</td>
											<td className={ADMIN_TD}>
												<span
													className={cn(
														"text-[13px]",
														user.role === "admin"
															? "font-medium text-foreground"
															: "text-muted-foreground",
													)}
												>
													{user.role === "admin"
														? "Admin"
														: "User"}
												</span>
											</td>
											<td className={ADMIN_TD}>
												<span
													className={cn(
														"text-[13px]",
														user.banned ||
															!user.emailVerified
															? "text-[var(--ed-accent)]"
															: "text-foreground",
													)}
												>
													{user.banned
														? "Banned"
														: user.emailVerified
															? "Active"
															: "Unverified"}
												</span>
												{user.banned &&
													user.banReason && (
														<span className="mt-1 block max-w-[22ch] truncate text-[12px] text-muted-foreground">
															{user.banReason}
														</span>
													)}
											</td>
											<td className={ADMIN_TD}>
												<span className="block min-w-[110px] text-right text-[12.5px] text-muted-foreground tabular-nums">
													{user.sessionCount}{" "}
													{user.sessionCount === 1
														? "session"
														: "sessions"}
													{user.orderCount > 0 &&
														` · ${user.orderCount} orders`}
												</span>
											</td>
											<td className={ADMIN_TD}>
												<span className="block min-w-[90px] text-right text-[12.5px] text-muted-foreground">
													{formatRelativeTime(
														new Date(
															user.createdAt,
														),
														new Date(),
													)}
												</span>
											</td>
											<td className={ADMIN_TD}>
												<div className="flex justify-end">
													<UserRowActions
														user={user}
														isSelf={isSelf}
														onChanged={refresh}
													/>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{users.length === 0 && (
						<div className="py-14 text-center">
							<p className="text-[13.5px] text-muted-foreground">
								{hasFilters
									? "Nobody matches those filters."
									: "No users yet."}
							</p>
							<div className="mt-5 flex justify-center">
								{hasFilters ? (
									<AdminButton
										size="sm"
										onClick={clearFilters}
									>
										Clear filters
									</AdminButton>
								) : (
									<AddUserButton />
								)}
							</div>
						</div>
					)}

					<TablePagination
						page={data?.page ?? 1}
						pageCount={data?.pageCount ?? 1}
						isPending={busy}
						onPage={(next) => void setParams({ page: next })}
					/>
				</>
			)}

			<AddUserSheet onCreated={refresh} />
		</div>
	);
}
