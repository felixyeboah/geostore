"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { useTranslations } from "@shared/lib/translations";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export function ContactForm() {
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(
			z.object({
				name: z.string().min(1),
				email: z.email(),
				message: z.string().min(10),
			}),
		),
		defaultValues: {
			name: "",
			email: "",
			message: "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			// TODO: Insert your contact form submission logic here to integrate with your CRM or email service
			console.log("Submitting contact form for values:", values);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch {
			form.setError("root", {
				message: t("contact.form.notifications.error"),
			});
		}
	});

	return (
		<div>
			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailCheckIcon />
					<AlertTitle>
						{t("contact.form.notifications.success")}
					</AlertTitle>
				</Alert>
			) : (
				<Form {...form}>
					<form
						onSubmit={onSubmit}
						className="flex flex-col items-stretch gap-7"
					>
						{form.formState.errors.root?.message && (
							<Alert variant="error">
								<MailIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="eyebrow text-muted-foreground">
										{t("contact.form.name")}
									</FormLabel>
									<FormControl>
										<Input
											className="h-12 rounded-[2px] border-border bg-transparent px-3.5 text-[14px] shadow-none focus-visible:border-foreground focus-visible:ring-0"
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
									<FormLabel className="eyebrow text-muted-foreground">
										{t("contact.form.email")}
									</FormLabel>
									<FormControl>
										<Input
											className="h-12 rounded-[2px] border-border bg-transparent px-3.5 text-[14px] shadow-none focus-visible:border-foreground focus-visible:ring-0"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="eyebrow text-muted-foreground">
										{t("contact.form.message")}
									</FormLabel>
									<FormControl>
										<Textarea
											className="rounded-[2px] border-border bg-transparent px-3.5 py-3 text-[14px] shadow-none focus-visible:border-foreground focus-visible:ring-0"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="mt-2 h-12 w-full rounded-[2px] px-[26px] font-semibold text-[14.5px] tracking-[-0.01em]"
							variant="primary"
							loading={form.formState.isSubmitting}
						>
							{t("contact.form.submit")}
						</Button>
					</form>
				</Form>
			)}
		</div>
	);
}
