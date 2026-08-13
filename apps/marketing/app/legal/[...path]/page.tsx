import { PostContent } from "@blog/components/PostContent";
import { getAllLegalPagePaths, getLegalPageByPath } from "@legal/lib/pages";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import { redirect } from "next/navigation";

export function generateStaticParams() {
	const paths = getAllLegalPagePaths();
	return paths.map((path) => ({ path: [path] }));
}

type Params = {
	path: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { path } = await props.params;
	const activePath = getActivePathFromUrlParam(path);
	const page = await getLegalPageByPath(activePath);

	return {
		title: page?.title,
		openGraph: {
			title: page?.title,
		},
	};
}

export default async function LegalPage(props: { params: Promise<Params> }) {
	const { path } = await props.params;

	const activePath = getActivePathFromUrlParam(path);
	const page = await getLegalPageByPath(activePath);

	if (!page) {
		redirect("/");
	}

	const { title, body } = page;

	return (
		<div className="container max-w-6xl py-16">
			<div className="mx-auto mb-12 max-w-2xl">
				<h1 className="text-center font-bold text-4xl">{title}</h1>
			</div>

			<PostContent content={body} />
		</div>
	);
}
