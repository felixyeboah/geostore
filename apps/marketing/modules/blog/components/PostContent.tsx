"use client";

import { mdxComponents } from "@blog/lib/mdx-components";
import { MDXContent } from "@content-collections/mdx/react";

export function PostContent({ content }: { content: string }) {
	return (
		<div className="prose prose-neutral max-w-[68ch] prose-headings:font-semibold prose-headings:tracking-[-0.035em] prose-a:text-[var(--ed-accent)] prose-a:decoration-1 prose-a:underline-offset-[3px] prose-p:text-[15.5px] prose-p:leading-[1.7] prose-li:text-[15.5px]">
			<MDXContent
				code={content}
				components={{
					a: mdxComponents.a,
				}}
			/>
		</div>
	);
}
