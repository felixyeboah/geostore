import { getSession } from "@auth/lib/server";
import { ChangeEmailForm } from "@settings/components/ChangeEmailForm";
import { ChangeNameForm } from "@settings/components/ChangeNameForm";
import { UserAvatarForm } from "@settings/components/UserAvatarForm";
import { SettingsList } from "@shared/components/SettingsList";
import { getTranslations } from "@shared/lib/translations";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("settings.account");

	return {
		title: t("title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<SettingsList>
			<UserAvatarForm />
			<ChangeNameForm />
			<ChangeEmailForm />
		</SettingsList>
	);
}
