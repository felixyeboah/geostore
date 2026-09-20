"use client";

import {
	discardLandingChangesAction,
	publishLandingChangesAction,
	stageLandingOrderAction,
	stageLandingVisibilityAction,
} from "@admin/actions/landing";
import { LandingSectionSheet } from "@admin/components/landing/LandingSectionSheet";
import { StorefrontChromeCard } from "@admin/components/landing/StorefrontChromeCard";
import { StorefrontPreview } from "@admin/components/landing/StorefrontPreview";
import { AdminButton } from "@admin/components/ui";
import type {
	LandingSectionDefinition,
	StorefrontChrome,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	EyeIcon,
	EyeOffIcon,
	LockIcon,
	PencilIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface LandingSectionState {
	key: string;
	isVisible: boolean;
	copy: Record<string, string>;
}

export interface LandingPublishSummary {
	userName: string | null;
	publishedAt: string;
	sections: number;
}

interface LandingSectionManagerProps {
	definitions: LandingSectionDefinition[];
	/** The staged state — what the preview shows and Publish would write. */
	initial: LandingSectionState[];
	/** The published state, kept to spot changes and restore on Discard. */
	published: LandingSectionState[];
	/** Product references that no longer resolve, per section key. */
	dangling: Record<string, number>;
	/** Storefront chrome, resolved — live and staged. */
	chromeLive: StorefrontChrome;
	chromeDraft: StorefrontChrome;
	/** Who last published, and when — null until the first publish. */
	lastPublish: LandingPublishSummary | null;
	/** Empty when NEXT_PUBLIC_MARKETING_URL is unset; the preview is dropped. */
	storefrontUrl: string;
	/** The draft-gated preview URL when the shared secret is configured. */
	previewUrl: string;
	previewIsDraft: boolean;
	/** The brands the catalogue carries, for the brand line's picker. */
	brands: string[];
}

function sameCopy(
	left: Record<string, string>,
	right: Record<string, string>,
): boolean {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	return (
		leftKeys.length === rightKeys.length &&
		leftKeys.every((key) => left[key] === right[key])
	);
}

function sameSection(
	left: LandingSectionState,
	right: LandingSectionState | undefined,
): boolean {
	return (
		right !== undefined &&
		left.isVisible === right.isVisible &&
		sameCopy(left.copy, right.copy)
	);
}

/**
 * The landing page editor: the running order beside the page itself.
 *
 * Every control here stages rather than publishes — a change lands in the
 * draft columns, the preview reloads to show it, and nothing reaches shoppers
 * until Publish. The `published` snapshot is what Discard returns to and what
 * the "staged" markers compare against.
 *
 * Order is changed with buttons rather than drag and drop. With fifteen bands
 * a drag is fiddly and impossible on a keyboard, and every move here is one
 * saved step that can be read back out loud.
 */
export function LandingSectionManager({
	definitions,
	initial,
	published: publishedInitial,
	dangling,
	chromeLive: chromeLiveInitial,
	chromeDraft: chromeDraftInitial,
	lastPublish,
	storefrontUrl,
	previewUrl,
	previewIsDraft,
	brands,
}: LandingSectionManagerProps) {
	const [sections, setSections] = useState(initial);
	const [published, setPublished] = useState(publishedInitial);
	const [chromeDraft, setChromeDraft] = useState(chromeDraftInitial);
	const [chromeLive, setChromeLive] = useState(chromeLiveInitial);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState(0);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const byKey = new Map(definitions.map((entry) => [entry.key, entry]));
	const publishedByKey = new Map(
		published.map((entry) => [entry.key, entry]),
	);
	const editing = editingKey ? (byKey.get(editingKey) ?? null) : null;
	const editingCopy =
		sections.find((entry) => entry.key === editingKey)?.copy ?? {};

	/** Anything that changes the draft changes the preview. */
	function refreshPreview() {
		setRefreshToken((token) => token + 1);
	}

	const changedSections = sections.filter(
		(entry) => !sameSection(entry, publishedByKey.get(entry.key)),
	).length;
	const orderChanged =
		sections.map((entry) => entry.key).join() !==
		published.map((entry) => entry.key).join();
	const dirtyCount =
		changedSections +
		(orderChanged ? 1 : 0) +
		Object.keys(chromeDraft).filter(
			(key) =>
				chromeDraft[key as keyof StorefrontChrome] !==
				chromeLive[key as keyof StorefrontChrome],
		).length;
	const isDirty = dirtyCount > 0;

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;

		if (target < 0 || target >= sections.length) {
			return;
		}

		const next = [...sections];
		const [moved] = next.splice(index, 1);
		next.splice(target, 0, moved);
		setSections(next);

		startTransition(async () => {
			try {
				const result = await stageLandingOrderAction(
					next.map((entry) => entry.key),
				);
				if (result.success) {
					refreshPreview();
				} else {
					// Put it back: the draft did not change.
					setSections(sections);
					toastError(result.message);
				}
			} catch {
				setSections(sections);
				toastError(
					"The change never reached the server — check your connection and try again.",
				);
			}
		});
	}

	function toggle(key: string) {
		const current = sections.find((entry) => entry.key === key);

		if (!current) {
			return;
		}

		const nextVisible = !current.isVisible;
		setSections((previous) =>
			previous.map((entry) =>
				entry.key === key
					? { ...entry, isVisible: nextVisible }
					: entry,
			),
		);

		startTransition(async () => {
			try {
				const result = await stageLandingVisibilityAction(
					key,
					nextVisible,
				);
				if (result.success) {
					toastSuccess(result.message);
					refreshPreview();
				} else {
					setSections((previous) =>
						previous.map((entry) =>
							entry.key === key
								? { ...entry, isVisible: current.isVisible }
								: entry,
						),
					);
					toastError(result.message);
				}
			} catch {
				setSections((previous) =>
					previous.map((entry) =>
						entry.key === key
							? { ...entry, isVisible: current.isVisible }
							: entry,
					),
				);
				toastError(
					"The change never reached the server — check your connection and try again.",
				);
			}
		});
	}

	function publish() {
		startTransition(async () => {
			try {
				const result = await publishLandingChangesAction();
				if (result.success) {
					// The draft just became the live page.
					setPublished(sections);
					setChromeLive(chromeDraft);
					toastSuccess(result.message);
					refreshPreview();
					// Picks up the fresh "last published" attribution.
					router.refresh();
				} else {
					toastError(result.message);
				}
			} catch {
				toastError(
					"Publish never reached the server — check your connection and try again.",
				);
			}
		});
	}

	function discard() {
		if (
			!window.confirm(
				"Discard every unpublished change? The page goes back to exactly what is live.",
			)
		) {
			return;
		}

		startTransition(async () => {
			try {
				const result = await discardLandingChangesAction();
				if (result.success) {
					setSections(published);
					setChromeDraft(chromeLive);
					toastSuccess(result.message);
					refreshPreview();
				} else {
					toastError(result.message);
				}
			} catch {
				toastError(
					"That never reached the server — check your connection and try again.",
				);
			}
		});
	}

	const hidden = sections.filter((entry) => !entry.isVisible).length;
	const edited = sections.filter(
		(entry) => Object.keys(entry.copy ?? {}).length > 0,
	).length;

	return (
		<>
			{isDirty && (
				<div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 border border-amber-500/40 bg-amber-500/10 px-4 py-3">
					<span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
						<TriangleAlertIcon className="size-4 text-amber-600" />
						{dirtyCount} unpublished{" "}
						{dirtyCount === 1 ? "change" : "changes"}
					</span>
					<span className="text-[12px] text-muted-foreground">
						The preview shows the draft; shoppers still see the
						published page.
					</span>
					<span className="ml-auto flex items-center gap-2">
						<AdminButton
							size="sm"
							onClick={discard}
							disabled={isPending}
						>
							Discard
						</AdminButton>
						<AdminButton
							size="sm"
							variant="primary"
							onClick={publish}
							disabled={isPending}
						>
							Publish changes
						</AdminButton>
					</span>
				</div>
			)}

			<div
				className={cn(
					"grid gap-8",
					storefrontUrl &&
						"lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-10",
				)}
			>
				<div className={cn(isPending && "opacity-60")}>
					<div className="flex items-baseline justify-between gap-3 border-border border-b pb-3">
						<p className="eyebrow text-muted-foreground">
							Running order
						</p>
						<p className="text-[12px] text-muted-foreground tabular-nums">
							{sections.length} bands
							{hidden > 0 && ` · ${hidden} hidden`}
							{edited > 0 && ` · ${edited} edited`}
						</p>
					</div>

					<ol className="mt-1">
						{sections.map((entry, index) => {
							const definition = byKey.get(entry.key);

							if (!definition) {
								return null;
							}

							const hasCopy =
								Object.keys(entry.copy ?? {}).length > 0;
							const staged = !sameSection(
								entry,
								publishedByKey.get(entry.key),
							);
							const missing = dangling[entry.key] ?? 0;
							const orderStaged =
								published.findIndex(
									(candidate) => candidate.key === entry.key,
								) !== index;

							return (
								<li
									key={entry.key}
									className="flex items-center gap-2 border-border border-b py-2.5"
								>
									<span className="w-5 shrink-0 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
										{index + 1}
									</span>

									<button
										type="button"
										onClick={() => setEditingKey(entry.key)}
										className="group min-w-0 flex-1 text-left"
									>
										<span className="flex items-center gap-2">
											<span
												className={cn(
													"truncate font-medium text-[13.5px] transition-colors group-hover:text-[var(--ed-accent)]",
													entry.isVisible
														? "text-foreground"
														: "text-muted-foreground line-through",
												)}
											>
												{definition.name}
											</span>
											{hasCopy && (
												<span className="eyebrow shrink-0 text-[var(--ed-accent)]">
													Edited
												</span>
											)}
											{(staged || orderStaged) && (
												<span className="eyebrow shrink-0 text-amber-600">
													Staged
												</span>
											)}
											{missing > 0 && (
												<span
													className="eyebrow shrink-0 text-destructive"
													title={`${missing} product ${
														missing === 1
															? "reference is"
															: "references are"
													} no longer in the catalogue`}
												>
													{missing} missing
												</span>
											)}
										</span>
										<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
											{definition.description}
										</span>
									</button>

									<div className="flex shrink-0 items-center">
										<button
											type="button"
											onClick={() =>
												setEditingKey(entry.key)
											}
											aria-label={`Edit ${definition.name}`}
											className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
										>
											<PencilIcon className="size-3.5" />
										</button>
										<button
											type="button"
											onClick={() => move(index, -1)}
											disabled={index === 0 || isPending}
											aria-label={`Move ${definition.name} up`}
											className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowUpIcon className="size-3.5" />
										</button>
										<button
											type="button"
											onClick={() => move(index, 1)}
											disabled={
												index === sections.length - 1 ||
												isPending
											}
											aria-label={`Move ${definition.name} down`}
											className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowDownIcon className="size-3.5" />
										</button>
										{definition.pinned ? (
											<span
												className="p-1.5 text-muted-foreground/50"
												title="This band is always shown"
											>
												<LockIcon className="size-3.5" />
											</span>
										) : (
											<button
												type="button"
												onClick={() =>
													toggle(entry.key)
												}
												disabled={isPending}
												aria-pressed={entry.isVisible}
												aria-label={
													entry.isVisible
														? `Hide ${definition.name}`
														: `Show ${definition.name}`
												}
												className="rounded-[2px] p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
											>
												{entry.isVisible ? (
													<EyeIcon className="size-3.5" />
												) : (
													<EyeOffIcon className="size-3.5" />
												)}
											</button>
										)}
									</div>
								</li>
							);
						})}
					</ol>

					<p className="mt-4 text-[12px] text-muted-foreground leading-[1.6]">
						Click a band to change its wording. The arrows move it
						up or down the page; the eye hides it from shoppers
						without deleting anything you have written.
						{lastPublish && (
							<>
								{" "}
								Last published by{" "}
								{lastPublish.userName ?? "an admin"} on{" "}
								{new Date(
									lastPublish.publishedAt,
								).toLocaleDateString("en-GB", {
									day: "numeric",
									month: "short",
								})}
								.
							</>
						)}
					</p>

					<StorefrontChromeCard
						values={chromeDraft}
						disabled={isPending}
						onSaved={(next) => {
							setChromeDraft(next);
							refreshPreview();
						}}
					/>
				</div>

				{storefrontUrl ? (
					<div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
						<StorefrontPreview
							url={storefrontUrl}
							previewUrl={previewUrl}
							isDraft={previewIsDraft}
							refreshToken={refreshToken}
							onRefresh={refreshPreview}
						/>
					</div>
				) : (
					<p className="border-border border-t pt-6 text-[13px] text-muted-foreground">
						Set{" "}
						<span className="font-mono">
							NEXT_PUBLIC_MARKETING_URL
						</span>{" "}
						to preview the page here.
					</p>
				)}
			</div>

			<LandingSectionSheet
				definition={editing}
				copy={editingCopy}
				brands={brands}
				onClose={() => setEditingKey(null)}
				onSaved={(copy) => {
					setSections((previous) =>
						previous.map((entry) =>
							entry.key === editingKey
								? { ...entry, copy }
								: entry,
						),
					);
					setEditingKey(null);
					refreshPreview();
				}}
			/>
		</>
	);
}
