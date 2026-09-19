"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationInvitationAlert } from "@organizations/components/OrganizationInvitationAlert";
import { authClient } from "@repo/auth/client";
import { config as authConfig } from "@repo/auth/config";
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
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "@shared/lib/translations";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	EyeIcon,
	EyeOffIcon,
	MailboxIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import { useSession } from "../hooks/use-session";
import { AUTH_BUTTON, AUTH_FIELD, AUTH_LABEL, AuthHeader } from "./AuthShell";
import { LoginModeSwitch } from "./LoginModeSwitch";

const formSchema = z.union([
	z.object({
		mode: z.literal("magic-link"),
		email: z.string().trim().email("Enter a valid email address."),
	}),
	z.object({
		mode: z.literal("password"),
		email: z.string().trim().email("Enter a valid email address."),
		password: z.string().min(1, "Password is required."),
	}),
]);

export function LoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			mode: authConfig.enablePasswordLogin ? "password" : "magic-link",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			if (values.mode === "password") {
				const { data, error } = await authClient.signIn.email({
					...values,
				});

				if (error) {
					throw error;
				}

				if ((data as any).twoFactorRedirect) {
					router.replace(
						withQuery(
							"/verify",
							Object.fromEntries(searchParams.entries()),
						),
					);
					return;
				}

				queryClient.invalidateQueries({
					queryKey: sessionQueryKey,
				});

				router.replace(redirectPath);
			} else {
				const { error } = await authClient.signIn.magicLink({
					...values,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
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

	const signinMode = form.watch("mode");

	return (
		<>
			<AuthHeader
				eyebrow={t("auth.login.customerAccount")}
				title={t("auth.login.title")}
				subtitle={t("auth.login.subtitle")}
			/>

			{form.formState.isSubmitSuccessful &&
			signinMode === "magic-link" ? (
				<Alert className="rounded-[2px]" variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.login.hints.linkSent.title")}
					</AlertTitle>
					<AlertDescription>
						{t("auth.login.hints.linkSent.message")}
					</AlertDescription>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							// Until React hydrates, a submit is a native one. Without a
							// method the browser defaults to GET and writes the typed
							// password into the URL, the address bar, and session history.
							method="post"
							className="space-y-6"
							onSubmit={onSubmit}
							noValidate
						>
							{authConfig.enableMagicLink &&
								authConfig.enablePasswordLogin && (
									<LoginModeSwitch
										activeMode={signinMode}
										onChange={(mode) =>
											form.setValue(
												"mode",
												mode as typeof signinMode,
											)
										}
									/>
								)}

							{form.formState.isSubmitted &&
								form.formState.errors.root?.message && (
									<Alert
										variant="error"
										className="rounded-[2px]"
									>
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
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
												className={AUTH_FIELD}
												placeholder={t(
													"auth.login.emailPlaceholder",
												)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin &&
								signinMode === "password" && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center justify-between gap-4">
													<FormLabel
														className={AUTH_LABEL}
													>
														{t(
															"auth.signup.password",
														)}
													</FormLabel>
													<Link
														href="/forgot-password"
														className="text-[12px] text-muted-foreground underline decoration-1 underline-offset-[3px] hover:text-foreground"
													>
														{t(
															"auth.login.forgotPassword",
														)}
													</Link>
												</div>
												<FormControl>
													<div className="relative">
														<Input
															type={
																showPassword
																	? "text"
																	: "password"
															}
															className={`${AUTH_FIELD} pr-12`}
															{...field}
															autoComplete="current-password"
														/>
														<button
															type="button"
															onClick={() =>
																setShowPassword(
																	!showPassword,
																)
															}
															className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground transition-colors hover:text-foreground"
															aria-label={
																showPassword
																	? "Hide password"
																	: "Show password"
															}
														>
															{showPassword ? (
																<EyeOffIcon className="size-4" />
															) : (
																<EyeIcon className="size-4" />
															)}
														</button>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

							<Button
								className={AUTH_BUTTON}
								type="submit"
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{signinMode === "magic-link"
									? t("auth.login.sendMagicLink")
									: t("auth.login.submit")}
							</Button>
						</form>
					</Form>
				</>
			)}

			<p className="mt-6 text-[12px] text-muted-foreground leading-[1.6]">
				{t("auth.login.legal")}{" "}
				<Link
					className="underline decoration-1 underline-offset-[3px] hover:text-foreground"
					href="/legal/terms"
				>
					{t("auth.login.terms")}
				</Link>{" "}
				and{" "}
				<Link
					className="underline decoration-1 underline-offset-[3px] hover:text-foreground"
					href="/legal/privacy-policy"
				>
					{t("auth.login.privacy")}
				</Link>
				.
			</p>
		</>
	);
}
