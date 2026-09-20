"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "@shared/lib/translations";
import { AlertTriangleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AUTH_BUTTON, AUTH_LABEL } from "./AuthShell";

const formSchema = z.object({
	code: z.string().min(6).max(6),
});

export function OtpForm() {
	const t = useTranslations();
	const router = useRouter();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const invitationId = searchParams.get("invitationId");
	const redirectTo = searchParams.get("redirectTo");

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.redirectAfterSignIn);

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			code: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ code }) => {
		try {
			const { error } = await authClient.twoFactor.verifyTotp({
				code,
			});

			if (error) {
				throw error;
			}

			router.replace(redirectPath);
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
				{t("auth.verify.title")}
			</h1>
			<p className="mt-4 mb-8 max-w-[44ch] text-[14.5px] text-muted-foreground leading-[1.6]">
				{t("auth.verify.message")}
			</p>

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
						name="code"
						render={({ field }) => (
							<FormItem>
								<FormLabel className={AUTH_LABEL}>
									{t("auth.verify.code")}
								</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={6}
										{...field}
										autoComplete="one-time-code"
										onChange={(value) => {
											field.onChange(value);
											onSubmit();
										}}
									>
										<InputOTPGroup>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={0}
											/>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={1}
											/>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={2}
											/>
										</InputOTPGroup>
										<InputOTPSeparator className="text-muted-foreground" />
										<InputOTPGroup>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={3}
											/>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={4}
											/>
											<InputOTPSlot
												className="size-12 rounded-[2px] border-border text-[17px]"
												index={5}
											/>
										</InputOTPGroup>
									</InputOTP>
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
						{t("auth.verify.submit")}
					</Button>
				</form>
			</Form>

			<div className="mt-9 border-border border-t pt-6 text-[13.5px] text-muted-foreground">
				<Link href="/login">
					<ArrowLeftIcon className="mr-1 inline size-4 align-middle" />
					{t("auth.verify.backToSignin")}
				</Link>
			</div>
		</>
	);
}
