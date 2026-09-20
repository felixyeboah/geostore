"use client";

import { AdminButton, AdminInput } from "@admin/components/ui";
import { authClient } from "@repo/auth/client";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { PlusIcon } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useState } from "react";

const NEW_USER_PARAM = parseAsBoolean
	.withDefault(false)
	.withOptions({ history: "push", shallow: true });

const LABEL = "eyebrow text-muted-foreground";

export function AddUserButton() {
	const [, setOpen] = useQueryState("new", NEW_USER_PARAM);

	return (
		<AdminButton variant="primary" onClick={() => setOpen(true)}>
			<PlusIcon className="size-4" />
			Add a user
		</AdminButton>
	);
}

/**
 * Creating an account by hand.
 *
 * This shop has no sign-up — only staff sign in — so without this the only way
 * to add a colleague was a script on someone's laptop. The password is set
 * here and shared out of band; there is no invitation email to intercept.
 */
export function AddUserSheet({ onCreated }: { onCreated: () => void }) {
	const [open, setOpen] = useQueryState("new", NEW_USER_PARAM);
	const [values, setValues] = useState({
		name: "",
		email: "",
		password: "",
		role: "user" as "user" | "admin",
	});
	const [isSaving, setIsSaving] = useState(false);

	function close() {
		void setOpen(null);
	}

	const canSubmit =
		values.name.trim().length > 1 &&
		values.email.includes("@") &&
		values.password.length >= 8;

	async function create() {
		setIsSaving(true);
		const { error } = await authClient.admin.createUser({
			name: values.name.trim(),
			email: values.email.trim(),
			password: values.password,
			role: values.role,
		});
		setIsSaving(false);

		if (error) {
			toastError("User not created", error.message);
			return;
		}

		toastSuccess(`${values.name} can now sign in`);
		setValues({ name: "", email: "", password: "", role: "user" });
		close();
		onCreated();
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					close();
				}
			}}
		>
			{/* `editorial`: Radix portals this out of the admin's token scope. */}
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-md"
			>
				<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
					<SheetTitle className="font-semibold text-[20px] text-foreground leading-tight tracking-[-0.02em]">
						Add a user
					</SheetTitle>
					<SheetDescription className="text-[13.5px] text-muted-foreground">
						There is no sign-up on this shop, so an account has to
						be made here. Share the password with them directly.
					</SheetDescription>
				</SheetHeader>

				<div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-7">
					<div>
						<label className={LABEL} htmlFor="new-user-name">
							Name
						</label>
						<AdminInput
							id="new-user-name"
							className="mt-2.5"
							value={values.name}
							placeholder="Ama Mensah"
							onChange={(event) =>
								setValues({
									...values,
									name: event.target.value,
								})
							}
						/>
					</div>

					<div>
						<label className={LABEL} htmlFor="new-user-email">
							Email
						</label>
						<AdminInput
							id="new-user-email"
							type="email"
							className="mt-2.5"
							value={values.email}
							placeholder="ama@geostoresgh.com"
							onChange={(event) =>
								setValues({
									...values,
									email: event.target.value,
								})
							}
						/>
					</div>

					<div>
						<label className={LABEL} htmlFor="new-user-password">
							Password
						</label>
						<AdminInput
							id="new-user-password"
							type="text"
							className="mt-2.5"
							value={values.password}
							placeholder="At least 8 characters"
							onChange={(event) =>
								setValues({
									...values,
									password: event.target.value,
								})
							}
						/>
						<p className="mt-2 text-[12px] text-muted-foreground">
							Shown rather than masked, because you have to pass
							it on. Ask them to change it once they are in.
						</p>
					</div>

					<fieldset>
						<legend className={LABEL}>Role</legend>
						<div className="mt-2.5 flex gap-2">
							{(["user", "admin"] as const).map((role) => (
								<button
									key={role}
									type="button"
									onClick={() =>
										setValues({ ...values, role })
									}
									aria-pressed={values.role === role}
									className={
										values.role === role
											? "border border-foreground px-3 py-1.5 text-[13px] text-foreground capitalize"
											: "border border-border px-3 py-1.5 text-[13px] text-muted-foreground capitalize transition-colors hover:border-foreground hover:text-foreground"
									}
								>
									{role}
								</button>
							))}
						</div>
						<p className="mt-2 text-[12px] text-muted-foreground">
							{values.role === "admin"
								? "Admins reach this back office and everything in it."
								: "Users can sign in but not open the back office."}
						</p>
					</fieldset>
				</div>

				<div className="shrink-0 border-border border-t px-6 py-4">
					<div className="flex items-center justify-end gap-2">
						<AdminButton
							type="button"
							onClick={close}
							disabled={isSaving}
						>
							Cancel
						</AdminButton>
						<AdminButton
							variant="primary"
							onClick={create}
							disabled={!canSubmit || isSaving}
						>
							{isSaving ? "Creating…" : "Create user"}
						</AdminButton>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
