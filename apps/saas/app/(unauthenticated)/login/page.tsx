import { LoginForm } from "@auth/components/LoginForm";
import { getTranslations } from "@shared/lib/translations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("auth.login");

	return {
		title: t("title"),
	};
}

export default function LoginPage() {
	return <LoginForm />;
}
