"use client";

import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useTranslations } from "@shared/lib/translations";

export function LoginModeSwitch({
	activeMode,
	onChange,
	className,
}: {
	activeMode: "password" | "magic-link";
	onChange: (mode: string) => void;
	className?: string;
}) {
	const t = useTranslations();
	return (
		<Tabs value={activeMode} onValueChange={onChange} className={className}>
			<TabsList className="grid h-11 w-full grid-cols-2 rounded-[2px] border border-border bg-transparent p-1">
				<TabsTrigger
					value="password"
					className="h-9 rounded-[2px] border-0 px-4 font-medium text-[13px] data-[state=active]:border-0 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
				>
					{t("auth.login.modes.password")}
				</TabsTrigger>
				<TabsTrigger
					value="magic-link"
					className="h-9 rounded-[2px] border-0 px-4 font-medium text-[13px] data-[state=active]:border-0 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
				>
					{t("auth.login.modes.magicLink")}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
