"use client";

import { AdminButton } from "@admin/components/ui";
import { cn } from "@repo/ui";
import {
	ArrowUpRightIcon,
	MonitorIcon,
	RotateCwIcon,
	SmartphoneIcon,
} from "lucide-react";
import { useState } from "react";

/** The width the storefront is composed for; the preview scales down to fit. */
const DESKTOP_WIDTH = 1280;

const MOBILE_WIDTH = 390;

type Device = "desktop" | "mobile";

/**
 * The landing page as it actually is.
 *
 * This screen used to be a list of section names beside a form of empty text
 * boxes, which asked an admin to picture the result. The page itself is a
 * click away and re-queries on every request, so the honest thing is to show
 * it: the preview is the real storefront in a frame, reloaded whenever
 * something here changes it.
 *
 * Desktop is scaled with `zoom` rather than `transform: scale`, because zoom
 * changes the space the element takes up — a transform would leave a
 * full-height gap under a shrunken page. Mobile renders at its true width,
 * since that is where most of the shop's customers are.
 */
export function StorefrontPreview({
	url,
	refreshToken,
	onRefresh,
}: {
	url: string;
	/** Changing this remounts the frame, which is how a save is reflected. */
	refreshToken: number;
	onRefresh: () => void;
}) {
	const [device, setDevice] = useState<Device>("desktop");

	const width = device === "desktop" ? DESKTOP_WIDTH : MOBILE_WIDTH;
	// A cache-buster as well as a remount: the browser would otherwise serve
	// the frame from its own cache and show the copy we just replaced.
	const previewUrl = `${url}${url.includes("?") ? "&" : "?"}preview=${refreshToken}`;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-border border-b pb-3">
				<p className="eyebrow text-muted-foreground">Live preview</p>

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

			<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/40 py-4">
				<div
					className={cn(
						"mx-auto border border-border bg-background",
						device === "mobile" && "w-[390px]",
					)}
					style={
						device === "desktop"
							? // Scaled to fit whatever width the pane has,
								// capped so it never renders larger than life.
								{ zoom: 0.58, width: DESKTOP_WIDTH }
							: undefined
					}
				>
					<iframe
						key={`${device}-${refreshToken}`}
						src={previewUrl}
						title="Storefront landing page preview"
						width={width}
						// Tall enough for the whole page: the frame has no
						// scrollbar of its own, the pane around it scrolls.
						height={device === "desktop" ? 6400 : 7600}
						className="block border-0"
						// The preview is our own storefront, but it is a
						// separate origin and nothing here needs it to reach
						// back, so it gets no more than it requires.
						sandbox="allow-scripts allow-same-origin"
						loading="lazy"
					/>
				</div>
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
