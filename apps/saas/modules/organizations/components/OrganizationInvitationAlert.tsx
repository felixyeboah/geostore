import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "@shared/lib/translations";

export function OrganizationInvitationAlert({
	className,
}: {
	className?: string;
}) {
	const t = useTranslations();
	return (
		<Alert variant="primary" className={className}>
			<MailCheckIcon />
			<AlertTitle>{t("organizations.invitationAlert.title")}</AlertTitle>
			<AlertDescription>
				{t("organizations.invitationAlert.description")}
			</AlertDescription>
		</Alert>
	);
}
