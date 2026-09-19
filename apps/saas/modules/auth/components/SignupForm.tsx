"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { useSession } from "@auth/hooks/use-session";
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
import { passwordSchema } from "@repo/utils";
import { PasswordInput } from "@shared/components/PasswordInput";
import { useTranslations } from "@shared/lib/translations";
import { AlertTriangleIcon, ArrowRightIcon, MailboxIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import {
	AUTH_BUTTON,
	AUTH_BUTTON_QUIET,
	AUTH_FIELD,
	AUTH_LABEL,
	AuthDivider,
} from "./AuthShell";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
	email: z.email(),
	name: z.string().min(1),
	password: passwordSchema,
});

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
	const t = useTranslations();
	const router = useRouter();
	const { user, loaded: sessionLoaded } = useSession();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		values: {
			name: "",
			email: prefillEmail ?? email ?? "",
			password: "",
		},
	});

	const invitationOnlyMode = !authConfig.enableSignup && invitationId;

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]);

	const onSubmit = form.handleSubmit(async ({ email, password, name }) => {
		try {
			const { error } = await (authConfig.enablePasswordLogin
				? await authClient.signUp.email({
						email,
						password,
						name,
						callbackURL: redirectPath,
					})
				: authClient.signIn.magicLink({
						email,
						name,
						callbackURL: redirectPath,
					}));

			if (error) {
				throw error;
			}

			if (invitationOnlyMode) {
				const { error } =
					await authClient.organization.acceptInvitation({
						invitationId,
					});

				if (error) {
					throw error;
				}

				router.push(config.redirectAfterSignIn);
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
		<div>
			<p className="eyebrow mb-4 text-muted-foreground">
				{t("auth.login.customerAccount")}
			</p>
			<h1 className="max-w-[16ch] font-semibold text-[clamp(28px,3vw,40px)] text-foreground leading-[1.05] tracking-[-0.042em]">
				{t("auth.signup.title")}
			</h1>
			<p className="mt-4 mb-9 max-w-[44ch] text-[14.5px] text-muted-foreground leading-[1.6]">
				{t("auth.signup.message")}
			</p>

			{form.formState.isSubmitSuccessful && !invitationOnlyMode ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.signup.hints.verifyEmail")}
					</AlertTitle>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							// Keeps a pre-hydration submit from putting the chosen
							// password in the URL. See LoginForm.
							method="post"
							className="flex flex-col items-stretch gap-6"
							onSubmit={onSubmit}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertDescription>
											{form.formState.errors.root.message}
										</AlertDescription>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className={AUTH_LABEL}>
											{t("auth.signup.name")}
										</FormLabel>
										<FormControl>
											<Input
												className={AUTH_FIELD}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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
												className={AUTH_FIELD}
												{...field}
												autoComplete="email"
												readOnly={!!prefillEmail}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className={AUTH_LABEL}>
												{t("auth.signup.password")}
											</FormLabel>
											<FormControl>
												<PasswordInput
													inputClassName={AUTH_FIELD}
													autoComplete="new-password"
													showGenerateButton
													showPasswordCriteria
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<Button
								className={AUTH_BUTTON}
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{t("auth.signup.submit")}
							</Button>
						</form>
					</Form>

					{authConfig.enableSignup &&
						authConfig.enableSocialLogin && (
							<>
								<AuthDivider
									label={t("auth.login.continueWith")}
								/>

								<div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
									{Object.keys(oAuthProviders).map(
										(providerId) => (
											<SocialSigninButton
												key={providerId}
												className={AUTH_BUTTON_QUIET}
												provider={
													providerId as OAuthProvider
												}
											/>
										),
									)}
								</div>
							</>
						)}
				</>
			)}

			<div className="mt-9 border-border border-t pt-6 text-[13.5px] text-muted-foreground">
				<span className="text-foreground/60">
					{t("auth.signup.alreadyHaveAccount")}{" "}
				</span>
				<Link
					href={withQuery(
						"/login",
						Object.fromEntries(searchParams.entries()),
					)}
				>
					{t("auth.signup.signIn")}
					<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
				</Link>
			</div>
		</div>
	);
}
