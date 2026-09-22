"use client";

import { useProductSelection } from "@commerce/components/ProductSelection";
import { cn } from "@repo/ui";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProductGalleryProps {
	name: string;
	images: string[];
	/** Renders over the main image, e.g. the "Just landed" flag. */
	badge?: React.ReactNode;
}

/**
 * The product image set: one large active shot with the rest as thumbnails
 * underneath it.
 *
 * The thumbnails are toggle buttons rather than a scroll-snap carousel, so the
 * whole set is reachable by keyboard and visible at a glance. They are not a
 * tablist: there is one shared panel rather than one per thumbnail, and
 * `aria-pressed` states which shot is showing without half-implementing tabs.
 * Left and right arrows still step through them.
 */
export function ProductGallery({ name, images, badge }: ProductGalleryProps) {
	// On the PDP the picked option value decides the shown set — Colour
	// "Black" swaps to Black's own shots. Elsewhere the prop wins.
	const shared = useProductSelection();
	const shown = shared?.galleryImages ?? images;

	const [activeIndex, setActiveIndex] = useState(0);
	const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

	// A new selection set means a new first shot — the previous index could
	// point at nothing or, worse, quietly show the last colour's photo.
	useEffect(() => {
		setActiveIndex(0);
	}, [shown]);

	// A product with a single image gets the frame and none of the machinery.
	const hasChoice = shown.length > 1;
	const activeImage = shown[activeIndex] ?? shown[0];

	function focusThumb(index: number) {
		const next = (index + shown.length) % shown.length;
		setActiveIndex(next);
		thumbRefs.current[next]?.focus();
	}

	return (
		<div className="flex min-w-0 flex-col gap-3 self-start lg:sticky lg:top-32">
			<div className="relative h-80 overflow-hidden bg-muted sm:h-96 lg:h-[min(65svh,36rem)]">
				{/*
				 * Every image is mounted and cross-faded rather than swapping
				 * one `src`, so switching a thumbnail never shows the empty
				 * frame while the next file downloads.
				 */}
				{shown.map((image, index) => (
					<Image
						key={image}
						src={image}
						alt={
							index === 0
								? name
								: `${name}, view ${index + 1} of ${shown.length}`
						}
						fill
						priority={index === 0}
						sizes="(min-width: 1024px) 58vw, 100vw"
						className={cn(
							"object-contain p-6 transition-opacity duration-300 lg:p-8",
							image === activeImage ? "opacity-100" : "opacity-0",
						)}
						aria-hidden={image === activeImage ? undefined : true}
					/>
				))}
				{badge}
			</div>

			{hasChoice && (
				<ul
					aria-label={`${name} images`}
					className="no-scrollbar flex items-center gap-2 overflow-x-auto"
				>
					{shown.map((image, index) => {
						const isActive = index === activeIndex;
						return (
							<li key={image}>
								<button
									ref={(node) => {
										thumbRefs.current[index] = node;
									}}
									type="button"
									aria-pressed={isActive}
									onClick={() => setActiveIndex(index)}
									onKeyDown={(event) => {
										if (event.key === "ArrowRight") {
											event.preventDefault();
											focusThumb(index + 1);
										}
										if (event.key === "ArrowLeft") {
											event.preventDefault();
											focusThumb(index - 1);
										}
									}}
									// The border is always in the box and only
									// changes colour, so nothing reflows on
									// selection. The padding keeps it clear of
									// the photograph, which is what makes it
									// readable over a dark or busy image.
									className={cn(
										"block shrink-0 rounded-[2px] border p-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1",
										isActive
											? "border-foreground"
											: "border-transparent hover:border-border",
									)}
								>
									<span className="sr-only">
										View image {index + 1} of {shown.length}
									</span>
									<span
										className={cn(
											"relative block size-[68px] overflow-hidden rounded-[1px] bg-muted transition-opacity md:size-[80px]",
											isActive
												? "opacity-100"
												: "opacity-60 hover:opacity-100",
										)}
									>
										<Image
											src={image}
											alt=""
											fill
											sizes="80px"
											className="object-contain"
										/>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
