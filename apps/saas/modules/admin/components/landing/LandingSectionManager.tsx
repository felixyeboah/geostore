"use client";

import {
	reorderLandingSectionsAction,
	setLandingSectionVisibilityAction,
} from "@admin/actions/landing";
import { LandingSectionSheet } from "@admin/components/landing/LandingSectionSheet";
import { StorefrontPreview } from "@admin/components/landing/StorefrontPreview";
import type { LandingSectionDefinition } from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	EyeIcon,
	EyeOffIcon,
	LockIcon,
	PencilIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

export interface LandingSectionState {
	key: string;
	isVisible: boolean;
	copy: Record<string, string>;
}

interface LandingSectionManagerProps {
	definitions: LandingSectionDefinition[];
	initial: LandingSectionState[];
	/** Empty when NEXT_PUBLIC_MARKETING_URL is unset; the preview is dropped. */
	storefrontUrl: string;
	/** The brands the catalogue carries, for the brand line's picker. */
	brands: string[];
}

/**
 * The landing page editor: the running order beside the page itself.
 *
 * Order is changed with buttons rather than drag and drop. With fifteen bands
 * a drag is fiddly and impossible on a keyboard, and every move here is one
 * saved step that can be read back out loud.
 */
export function LandingSectionManager({
	definitions,
	initial,
	storefrontUrl,
	brands,
}: LandingSectionManagerProps) {
	const [sections, setSections] = useState(initial);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState(0);
	const [isPending, startTransition] = useTransition();

	const byKey = new Map(definitions.map((entry) => [entry.key, entry]));
	const editing = editingKey ? (byKey.get(editingKey) ?? null) : null;
	const editingCopy =
		sections.find((entry) => entry.key === editingKey)?.copy ?? {};

	/** Anything that changes the page changes the preview. */
	function refreshPreview() {
		setRefreshToken((token) => token + 1);
	}

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
			const result = await reorderLandingSectionsAction(
				next.map((entry) => entry.key),
			);
			if (result.success) {
				refreshPreview();
			} else {
				// Put it back: the page the shopper sees did not change.
				setSections(sections);
				toastError(result.message);
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
			const result = await setLandingSectionVisibilityAction(
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
		});
	}

	const hidden = sections.filter((entry) => !entry.isVisible).length;
	const edited = sections.filter(
		(entry) => Object.keys(entry.copy ?? {}).length > 0,
	).length;

	return (
		<>
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
					</p>
				</div>

				{storefrontUrl ? (
					<div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
						<StorefrontPreview
							url={storefrontUrl}
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
