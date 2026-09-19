"use client";

import type { Post } from "@blog/types";
import Image from "next/image";
import Link from "next/link";

export function PostListItem({ post }: { post: Post }) {
	const { title, excerpt, authorName, image, date, path, authorImage, tags } =
		post;

	return (
		<article className="group flex min-w-0 flex-col">
			{image && (
				<Link
					href={`/blog/${path}`}
					className="relative block aspect-[4/5] overflow-hidden rounded-[2px] bg-muted"
				>
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
					/>
				</Link>
			)}

			{tags && tags.length > 0 && (
				<p className="eyebrow mt-6 text-muted-foreground">
					{tags.join(" · ")}
				</p>
			)}

			<h2 className="mt-3.5 font-semibold text-[clamp(18px,1.5vw,21px)] text-foreground leading-[1.15] tracking-[-0.03em]">
				<Link
					href={`/blog/${path}`}
					className="hover:text-[var(--ed-accent)]"
				>
					{title}
				</Link>
			</h2>

			{excerpt && (
				<p className="mt-3 max-w-[42ch] text-[14px] text-muted-foreground leading-[1.6]">
					{excerpt}
				</p>
			)}

			<div className="mt-auto flex items-center justify-between gap-4 border-border border-t pt-4 text-[12px] text-muted-foreground">
				{authorName && (
					<span className="flex min-w-0 items-center gap-2">
						{authorImage && (
							<span className="relative size-6 shrink-0 overflow-hidden rounded-full">
								<Image
									src={authorImage}
									alt={authorName}
									fill
									sizes="48px"
									className="object-cover object-center"
								/>
							</span>
						)}
						<span className="truncate">{authorName}</span>
					</span>
				)}
				<time className="shrink-0 tabular-nums" dateTime={String(date)}>
					{Intl.DateTimeFormat("en").format(new Date(date))}
				</time>
			</div>
		</article>
	);
}
