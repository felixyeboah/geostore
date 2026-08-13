import { PostContent } from "@blog/components/PostContent";
import { getPostBySlug, getPublishedPostPaths } from "@blog/lib/posts";
import { getBaseUrl } from "@shared/lib/base-url";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import { getTranslations } from "@shared/lib/translations";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export function generateStaticParams() {
	const paths = getPublishedPostPaths();
	return paths.map((path) => ({ path: [path] }));
}

type Params = {
	path: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { path } = await props.params;
	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug);

	return {
		title: post?.title,
		description: post?.excerpt,
		openGraph: {
			title: post?.title,
			description: post?.excerpt,
			images: post?.image
				? [
						post.image.startsWith("http")
							? post.image
							: new URL(post.image, getBaseUrl()).toString(),
					]
				: [],
		},
	};
}

export default async function BlogPostPage(props: { params: Promise<Params> }) {
	const { path } = await props.params;

	const t = await getTranslations({ namespace: "blog" });

	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug);

	if (!post) {
		redirect("/blog");
	}

	const { title, date, authorName, authorImage, tags, image, body } = post;

	return (
		<div className="container py-16">
			<div className="">
				<div className="mb-12">
					<Link href="/blog">&larr; {t("back")}</Link>
				</div>

				<div className="max-w-2xl mx-auto text-center">
					<h1 className="font-bold text-4xl">{title}</h1>

					<div className="mt-4 flex items-center justify-center gap-6">
						{authorName && (
							<div className="flex items-center">
								{authorImage && (
									<div className="relative mr-2 size-8 overflow-hidden rounded-full">
										<Image
											src={authorImage}
											alt={authorName}
											fill
											sizes="96px"
											className="object-cover object-center"
										/>
									</div>
								)}
								<div>
									<p className="font-semibold text-sm opacity-50">
										{authorName}
									</p>
								</div>
							</div>
						)}

						<div className="mr-0">
							<p className="text-sm opacity-30">
								{Intl.DateTimeFormat("en-US").format(
									new Date(date),
								)}
							</p>
						</div>

						{tags && (
							<div className="flex flex-wrap gap-2">
								{tags.map((tag) => (
									<span
										key={tag}
										className="font-semibold text-primary text-xs uppercase tracking-wider"
									>
										#{tag}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{image && (
				<div className="relative mt-6 aspect-video overflow-hidden rounded-4xl bg-primary/10 p-4 lg:p-6">
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center rounded-xl"
					/>
				</div>
			)}

			<div className="pb-8">
				<PostContent content={body} />
			</div>
		</div>
	);
}
