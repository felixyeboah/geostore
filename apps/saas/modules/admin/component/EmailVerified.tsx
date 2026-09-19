import { cn } from "@repo/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { useTranslations } from "@shared/lib/translations";
import { CheckIcon, ClockIcon } from "lucide-react";

export function EmailVerified({
	verified,
	className,
}: {
	verified: boolean;
	className?: string;
}) {
	const t = useTranslations();
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipContent>
					{verified
						? t("admin.users.emailVerified.verified")
						: t("admin.users.emailVerified.waiting")}
				</TooltipContent>
				<TooltipTrigger className={cn(className)}>
					{verified ? (
						<CheckIcon className="size-3 text-primary" />
					) : (
						<ClockIcon className="size-3" />
					)}
				</TooltipTrigger>
			</Tooltip>
		</TooltipProvider>
	);
}
