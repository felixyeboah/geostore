"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useTranslations } from "@shared/lib/translations";
import { AlertTriangleIcon, ArrowLeftIcon, MailboxIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AUTH_BUTTON, AUTH_FIELD, AUTH_LABEL } from "./AuthShell";

const formSchema = z.object({
	email: z.email(),
});

export function ForgotPasswordForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			const redirectTo = new URL(
				"/reset-password",
				window.location.origin,
			).toString();

			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo,
			});

			if (error) {
				throw error;
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	});

	return (
		<>
			<p className="eyebrow mb-4 text-muted-foreground">
				{t("auth.login.customerAccount")}
			</p>
			<h1 className="max-w-[16ch] font-semibold text-[clamp(28px,3vw,40px)] text-foreground leading-[1.05] tracking-[-0.042em]">
				{t("auth.forgotPassword.title")}
			</h1>
			<p className="mt-4 mb-9 max-w-[44ch] text-[14.5px] text-muted-foreground leading-[1.6]">
				{t("auth.forgotPassword.message")}{" "}
			</p>

			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.forgotPassword.hints.linkSent.title")}
					</AlertTitle>
					<AlertDescription>
						{t("auth.forgotPassword.hints.linkSent.message")}
					</AlertDescription>
				</Alert>
			) : (
				<Form {...form}>
					<form
						className="flex flex-col items-stretch gap-6"
						onSubmit={onSubmit}
					>
						{form.formState.errors.root && (
							<Alert variant="error">
								<AlertTriangleIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel className={AUTH_LABEL}>
										{t("auth.forgotPassword.email")}
									</FormLabel>
									<FormControl>
										<Input
											className={AUTH_FIELD}
											{...field}
											autoComplete="email"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							className={AUTH_BUTTON}
							variant="primary"
							loading={form.formState.isSubmitting}
						>
							{t("auth.forgotPassword.submit")}
						</Button>
					</form>
				</Form>
			)}

			<div className="mt-9 border-border border-t pt-6 text-[13.5px] text-muted-foreground">
				<Link href="/login">
					<ArrowLeftIcon className="mr-1 inline size-4 align-middle" />
					{t("auth.forgotPassword.backToSignin")}
				</Link>
			</div>
		</>
	);
}
