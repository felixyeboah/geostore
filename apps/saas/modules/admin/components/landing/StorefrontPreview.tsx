"use client";

import { AdminButton } from "@admin/components/ui";
import { cn } from "@repo/ui";
import {
	ArrowUpRightIcon,
	MonitorIcon,
	RotateCwIcon,
	SmartphoneIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The width the storefront is composed for; the preview scales down to fit. */
const DESKTOP_WIDTH = 1280;

const MOBILE_WIDTH = 390;

type Device = "desktop" | "mobile";

/**
 * The landing page as it will look once published.
 *
 * This screen used to be a list of section names beside a form of empty text
 * boxes, which asked an admin to picture the result. The page itself is a
 * click away and re-queries on every request, so the honest thing is to show
 * it: the preview is the real storefront in a frame, reloaded whenever
 * something here changes it. With the draft flag it renders the staged
 * changes — exactly what Publish would produce.
 *
 * The frame fills the pane and scrolls inside itself, the way the page does
 * for a customer — a fixed pixel height used to clip the page short or leave
 * a stretch of dead space under it. Desktop is scaled with `zoom` rather than
 * `transform: scale`, because zoom changes the space the element takes up — a
 * transform would leave a full-height gap under a shrunken page. Mobile
 * renders at its true width, since that is where most of the shop's customers
 * are.
 */
export function StorefrontPreview({
	url,
	previewUrl,
	isDraft,
	refreshToken,
	onRefresh,
}: {
	/** The storefront's own URL, for the "open" link. */
	url: string;
	/** What the frame loads — draft-gated when the shared secret is set. */
	previewUrl: string;
	isDraft: boolean;
	/** Changing this remounts the frame, which is how a save is reflected. */
	refreshToken: number;
	onRefresh: () => void;
}) {
	const [device, setDevice] = useState<Device>("desktop");
	const paneRef = useRef<HTMLDivElement>(null);
	const [zoom, setZoom] = useState(0.58);

	// Fit the composed 1280px page into whatever width the pane has — capped
	// at 1 so it never renders larger than life, floored so a narrow pane
	// still shows a page rather than a sliver.
	useEffect(() => {
		const pane = paneRef.current;
		if (!pane) {
			return;
		}

		const measure = () => {
			setZoom(
				Math.min(1, Math.max(0.35, pane.clientWidth / DESKTOP_WIDTH)),
			);
		};
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(pane);
		return () => observer.disconnect();
	}, []);

	// A cache-buster as well as a remount: the browser would otherwise serve
	// the frame from its own cache and show the copy we just replaced.
	const src = `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}t=${refreshToken}`;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-border border-b pb-3">
				<p className="flex items-center gap-2">
					<span className="eyebrow text-muted-foreground">
						Preview
					</span>
					<span
						className={cn(
							"rounded-[2px] px-1.5 py-px font-medium text-[10.5px]",
							isDraft
								? "bg-amber-500/15 text-amber-700"
								: "bg-muted text-muted-foreground",
						)}
					>
						{isDraft ? "Draft" : "Live"}
					</span>
				</p>

				<div className="flex items-center gap-1">
					<DeviceButton
						icon={<MonitorIcon className="size-3.5" />}
						label="Desktop"
						isActive={device === "desktop"}
						onClick={() => setDevice("desktop")}
					/>
					<DeviceButton
						icon={<SmartphoneIcon className="size-3.5" />}
						label="Mobile"
						isActive={device === "mobile"}
						onClick={() => setDevice("mobile")}
					/>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<AdminButton size="sm" onClick={onRefresh}>
						<RotateCwIcon className="size-3.5" />
						Refresh
					</AdminButton>
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
					>
						Open
						<ArrowUpRightIcon className="size-3.5" />
					</a>
				</div>
			</div>

			<div
				ref={paneRef}
				className="relative min-h-0 flex-1 overflow-hidden bg-muted/40 py-4"
			>
				{device === "desktop" ? (
					<div
						className="mx-auto h-full border border-border bg-background"
						style={{ zoom, width: DESKTOP_WIDTH }}
					>
						<iframe
							key={`${device}-${refreshToken}`}
							src={src}
							title="Storefront landing page preview"
							width={DESKTOP_WIDTH}
							// Plain 100%, not `100 / zoom`. The wrapper is
							// already zoomed *and* `h-full`, so its painted
							// height is the pane's height and a percentage of
							// it needs no further correction. Compensating a
							// second time made the frame 1/zoom too tall —
							// measured at 1284px inside a 611px pane, leaving
							// 690px of the page permanently below the fold
							// with no way to scroll to it.
							style={{ height: "100%" }}
							className="block border-0"
							// The preview is our own storefront, but it is a
							// separate origin and nothing here needs it to reach
							// back, so it gets no more than it requires.
							sandbox="allow-scripts allow-same-origin"
							loading="lazy"
						/>
					</div>
				) : (
					<div className="mx-auto h-full w-[390px] border border-border bg-background">
						<iframe
							key={`${device}-${refreshToken}`}
							src={src}
							title="Storefront landing page preview"
							width={MOBILE_WIDTH}
							height="100%"
							className="block border-0"
							sandbox="allow-scripts allow-same-origin"
							loading="lazy"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function DeviceButton({
	icon,
	label,
	isActive,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={isActive}
			className={cn(
				"inline-flex items-center gap-1.5 border px-2 py-1 text-[12px] transition-colors",
				isActive
					? "border-foreground text-foreground"
					: "border-transparent text-muted-foreground hover:text-foreground",
			)}
		>
			{icon}
			{label}
		</button>
	);
}
