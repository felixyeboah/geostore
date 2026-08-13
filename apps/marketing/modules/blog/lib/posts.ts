import type { Post } from "@blog/types";
import { getUniqueBasePaths } from "@shared/lib/content";
import { allPosts } from "content-collections";

/**
 * Returns paths of all published posts for use in generateStaticParams.
 */
export function getPublishedPostPaths(): string[] {
	const paths = getUniqueBasePaths(allPosts);
	return paths.filter((path) => {
		const post = allPosts.find((item) => item.path === path);
		return post?.published === true;
	});
}

/**
 * Returns all published posts.
 */
export async function getAllPosts(): Promise<Post[]> {
	const paths = getUniqueBasePaths(allPosts);

	const posts = paths
		.map((path) => allPosts.find((post) => post.path === path))
		.filter((post): post is NonNullable<typeof post> => post != null)
		.filter((post) => post.published);

	return Promise.resolve(
		posts.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		),
	);
}

/**
 * Returns a post by slug.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
	const post = allPosts.find((item) => item.path === slug);

	return Promise.resolve(post ?? null);
}
