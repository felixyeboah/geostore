"use client";

import { authClient } from "@repo/auth/client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	MailCheckIcon,
	MoreHorizontalIcon,
	ShieldCheckIcon,
	ShieldXIcon,
	SquareUserRoundIcon,
	Trash2Icon,
	UserCheckIcon,
	UserXIcon,
} from "lucide-react";
import { useState, useTransition } from "react";

export interface UserRow {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string | null;
	banned: boolean;
	banReason: string | null;
	emailVerified: boolean;
	createdAt: string;
	sessionCount: number;
	orderCount: number;
}

/**
 * Everything an admin can do to an account.
 *
 * The list previously offered impersonate, role and delete. Banning was
 * missing, which left "stop this person signing in" and "erase them" as the
 * same button — the destructive one. Ban is reversible and is what is usually
 * wanted, so it sits above the separator and delete sits below it.
 */
export function UserRowActions({
	user,
	isSelf,
	onChanged,
}: {
	user: UserRow;
	/** You cannot ban, demote or delete the account you are signed in as. */
	isSelf: boolean;
	onChanged: () => void;
}) {
	const [confirming, setConfirming] = useState<"ban" | "delete" | null>(null);
	const [isPending, startTransition] = useTransition();

	const isAdmin = user.role === "admin";

	function run(
		label: string,
		action: () => Promise<{ error?: { message?: string } | null }>,
	) {
		startTransition(async () => {
			try {
				const { error } = await action();
				setConfirming(null);

				if (error) {
					toastError(label, error.message);
					return;
				}

				toastSuccess(label);
				onChanged();
			} catch (error) {
				setConfirming(null);
				toastError(
					label,
					error instanceof Error ? error.message : undefined,
				);
			}
		});
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={`Actions for ${user.name || user.email}`}
					className="inline-flex size-8 items-center justify-center rounded-[2px] border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-border focus-visible:outline-none data-[state=open]:border-border data-[state=open]:text-foreground"
				>
					<MoreHorizontalIcon className="size-4" />
				</DropdownMenuTrigger>
				{/*
				 * `editorial` again: Radix portals the panel to <body>, out of
				 * reach of the admin layout's token overrides.
				 */}
				<DropdownMenuContent
					align="end"
					className="editorial w-56 rounded-[2px]"
				>
					<DropdownMenuItem
						disabled={isPending || isSelf}
						onSelect={() =>
							run("Impersonating", async () => {
								const result =
									await authClient.admin.impersonateUser({
										userId: user.id,
									});
								if (!result.error) {
									window.location.href = "/";
								}
								return result;
							})
						}
						className="cursor-pointer gap-2"
					>
						<SquareUserRoundIcon className="size-4" />
						Sign in as this user
					</DropdownMenuItem>

					{!user.emailVerified && (
						<DropdownMenuItem
							disabled={isPending}
							onSelect={() =>
								run("Verification email sent", () =>
									authClient.sendVerificationEmail({
										email: user.email,
									}),
								)
							}
							className="cursor-pointer gap-2"
						>
							<MailCheckIcon className="size-4" />
							Resend verification
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />

					<DropdownMenuItem
						disabled={isPending || isSelf}
						onSelect={() =>
							run(
								isAdmin
									? `${user.name} is no longer an admin`
									: `${user.name} is now an admin`,
								() =>
									authClient.admin.setRole({
										userId: user.id,
										role: isAdmin ? "user" : "admin",
									}),
							)
						}
						className="cursor-pointer gap-2"
					>
						{isAdmin ? (
							<ShieldXIcon className="size-4" />
						) : (
							<ShieldCheckIcon className="size-4" />
						)}
						{isAdmin ? "Remove admin role" : "Make an admin"}
					</DropdownMenuItem>

					{user.banned ? (
						<DropdownMenuItem
							disabled={isPending}
							onSelect={() =>
								run(`${user.name} can sign in again`, () =>
									authClient.admin.unbanUser({
										userId: user.id,
									}),
								)
							}
							className="cursor-pointer gap-2"
						>
							<UserCheckIcon className="size-4" />
							Lift the ban
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem
							disabled={isPending || isSelf}
							onSelect={() => setConfirming("ban")}
							className="cursor-pointer gap-2"
						>
							<UserXIcon className="size-4" />
							Ban from signing in
						</DropdownMenuItem>
					)}

					<DropdownMenuSeparator />

					<DropdownMenuItem
						disabled={isPending || isSelf}
						onSelect={() => setConfirming("delete")}
						className="cursor-pointer gap-2 text-destructive focus:text-destructive"
					>
						<Trash2Icon className="size-4" />
						Delete account
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={confirming !== null}
				onOpenChange={(open) => !open && setConfirming(null)}
			>
				<AlertDialogContent className="editorial rounded-[2px]">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirming === "ban"
								? `Ban ${user.name || user.email}?`
								: `Delete ${user.name || user.email}?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirming === "ban"
								? "They stay in the list and keep their history, but cannot sign in until the ban is lifted. Their open sessions end immediately."
								: user.orderCount > 0
									? `This erases the account for good. Their ${user.orderCount} ${user.orderCount === 1 ? "order stays" : "orders stay"} in the book, but stop being linked to anyone. Banning is reversible; this is not.`
									: "This erases the account for good. Banning is reversible; this is not."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								if (confirming === "ban") {
									run(`${user.name} is banned`, () =>
										authClient.admin.banUser({
											userId: user.id,
										}),
									);
								} else {
									run(`${user.name} deleted`, () =>
										authClient.admin.removeUser({
											userId: user.id,
										}),
									);
								}
							}}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isPending
								? "Working…"
								: confirming === "ban"
									? "Ban"
									: "Delete account"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
