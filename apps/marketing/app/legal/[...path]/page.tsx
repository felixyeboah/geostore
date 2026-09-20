import { PostContent } from "@blog/components/PostContent";
import { getAllLegalPagePaths, getLegalPageByPath } from "@legal/lib/pages";
import {
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
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
		<EditorialShell>
			<EditorialContainer className="py-16 lg:py-24">
				<EditorialHeader eyebrow="Legal" title={title} />
				<div className="mt-14 border-foreground border-t pt-12">
					<PostContent content={body} />
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
