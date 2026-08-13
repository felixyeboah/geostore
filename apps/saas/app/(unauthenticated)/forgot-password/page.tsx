import { ForgotPasswordForm } from "@auth/components/ForgotPasswordForm";
import { getTranslations } from "@shared/lib/translations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("auth.forgotPassword");

	return {
		title: t("title"),
	};
}

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
