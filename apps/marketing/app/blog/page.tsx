import { PostListItem } from "@blog/components/PostListItem";
import { getAllPosts } from "@blog/lib/posts";
import {
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { pageMetadata } from "@shared/lib/seo";
import { getTranslations } from "@shared/lib/translations";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "blog" });
	return pageMetadata({
		title: t("title"),
		description: t("description"),
		path: "/blog",
	});
}

export default async function BlogListPage() {
	const t = await getTranslations({ namespace: "blog" });
	const posts = await getAllPosts();

	return (
		<EditorialShell>
			<EditorialContainer className="py-16 lg:py-24">
				<EditorialHeader
					eyebrow="Journal"
					title={t("title")}
					subtitle={t("description")}
					aside={`${String(posts.length).padStart(2, "0")} — ${posts.length === 1 ? "post" : "posts"}`}
				/>

				<div className="mt-14 grid gap-x-10 gap-y-14 border-foreground border-t pt-12 md:grid-cols-2 lg:grid-cols-3">
					{posts.map((post) => (
						<PostListItem post={post} key={post.path} />
					))}
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
