"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { authClient } from "@repo/auth/client";
import { cn } from "@repo/ui";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { UserAvatar } from "@shared/components/UserAvatar";
import { useTranslations } from "@shared/lib/translations";
import {
	LogOutIcon,
	MoreVerticalIcon,
	ShieldCheckIcon,
	UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { ColorModeToggle } from "./ColorModeToggle";

interface UserMenuProps {
	/** Name and email beside the avatar in the trigger (the sidebar). */
	showUserName?: boolean;
	/**
	 * `admin` dresses the menu in the editorial language and drops the colour
	 * mode row — the admin is a fixed light surface, so the switch could only
	 * confuse. `default` keeps it for the account area, which still themes.
	 */
	variant?: "default" | "admin";
}

/**
 * The account menu: who is signed in, the two things they can do about it,
 * and the way out. Documentation and Home were cut — the first pointed at the
 * starter kit's docs, the second duplicated "View the shop" a few pixels away.
 */
export function UserMenu({ showUserName, variant = "default" }: UserMenuProps) {
	const t = useTranslations();
	const { user } = useSession();
	const isAdmin = variant === "admin";

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	if (!user) {
		return null;
	}

	const { name, email, image } = user;
	const role = (user as { role?: string | null }).role;

	const itemClass =
		"cursor-pointer gap-3 rounded-[2px] px-3 py-2 text-[13.5px] text-foreground focus:bg-muted focus:text-foreground";
	const inkAvatar = isAdmin ? "rounded-full [&_img]:rounded-full" : undefined;
	const inkFallback = isAdmin
		? "rounded-full bg-foreground font-semibold text-background"
		: undefined;
	const iconClass = "size-[15px] shrink-0 text-muted-foreground";

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex w-full cursor-pointer items-center justify-between gap-2 rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
						!isAdmin &&
							"rounded-lg focus-visible:ring-primary md:w-[100%+1rem] md:px-2 md:py-1.5 md:hover:bg-primary/5",
					)}
					aria-label="Account menu"
				>
					<span className="flex items-center gap-2">
						<UserAvatar
							name={name ?? ""}
							avatarUrl={image}
							className={cn("size-8", inkAvatar)}
							fallbackClassName={cn(inkFallback, "text-[11px]")}
						/>
						{showUserName && (
							<span className="text-left leading-tight">
								<span className="font-medium text-sm">
									{name}
								</span>
								<span className="block text-xs opacity-70">
									{email}
								</span>
							</span>
						)}
					</span>

					{showUserName && <MoreVerticalIcon className="size-4" />}
				</button>
			</DropdownMenuTrigger>

			{/*
			 * `editorial` is repeated on the panel: Radix portals it to <body>,
			 * outside the admin layout's token scope. Same trap as AdminSelect.
			 */}
			<DropdownMenuContent
				align="end"
				sideOffset={10}
				className={cn(
					"w-[268px] p-1",
					isAdmin &&
						"editorial rounded-[2px] border-border bg-background text-foreground shadow-[0_12px_40px_-12px_rgba(17,17,16,0.22)]",
				)}
			>
				<div className="flex items-center gap-3 px-3 py-3">
					<UserAvatar
						name={name ?? ""}
						avatarUrl={image}
						className={cn("size-9", inkAvatar)}
						fallbackClassName={cn(inkFallback, "text-[12px]")}
					/>
					<div className="min-w-0">
						<p className="truncate font-semibold text-[14px] text-foreground leading-tight tracking-[-0.01em]">
							{name}
						</p>
						<p className="mt-0.5 truncate text-[12.5px] text-muted-foreground leading-tight">
							{email}
						</p>
					</div>
					{role === "admin" && (
						<span className="eyebrow ml-auto shrink-0 self-start text-[9.5px] text-muted-foreground">
							Admin
						</span>
					)}
				</div>

				<DropdownMenuSeparator className={cn(isAdmin && "bg-border")} />

				{!isAdmin && (
					<>
						<DropdownMenuItem
							className="flex items-center justify-between gap-4 hover:bg-transparent focus:bg-transparent"
							onSelect={(event) => event.preventDefault()}
						>
							<span>{t("app.userMenu.colorMode")}</span>
							<ColorModeToggle />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}

				<DropdownMenuItem asChild className={itemClass}>
					<Link href="/settings/general">
						<UserRoundIcon className={iconClass} />
						{t("app.userMenu.accountSettings")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className={itemClass}>
					<Link href="/settings/security">
						<ShieldCheckIcon className={iconClass} />
						{t("app.userMenu.security")}
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator className={cn(isAdmin && "bg-border")} />

				<DropdownMenuItem onClick={onLogout} className={itemClass}>
					<LogOutIcon className={iconClass} />
					{t("app.userMenu.logout")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
