import { OrganizationForm } from "@admin/component/organizations/OrganizationForm";
import { getAdminPath } from "@admin/lib/links";
import { Button } from "@repo/ui";
import { getTranslations } from "@shared/lib/translations";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default async function OrganizationFormPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ backTo?: string }>;
}) {
	const { id } = await params;
	const { backTo } = await searchParams;

	const t = await getTranslations("admin.organizations");
	return (
		<div>
			<div className="mb-2 flex justify-start">
				<Button variant="link" size="sm" asChild className="px-0">
					<Link
						href={
							backTo?.startsWith("/admin/organizations?")
								? backTo
								: getAdminPath("/organizations")
						}
					>
						<ArrowLeftIcon className="mr-1.5 size-4" />
						{t("backToList")}
					</Link>
				</Button>
			</div>
			<OrganizationForm organizationId={id} />
		</div>
	);
}
