"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Container, Eyebrow } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	email: z.email(),
});

export function NewsletterSection() {
	const t = useTranslations();

	const form = useForm({
		resolver: zodResolver(formSchema),
	});

	const onSubmit = form.handleSubmit(async () => {
		try {
			// TODO: connect to the mailing list provider.
			await new Promise((resolve) => setTimeout(resolve, 600));
		} catch {
			form.setError("email", {
				message: t("newsletter.hints.error.message"),
			});
		}
	});

	return (
		<section className="bg-[#5e4e98] text-white">
			<Container className="grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
				<div>
					<Eyebrow className="text-[10px] text-white/80">
						{t("newsletter.eyebrow")}
					</Eyebrow>
					<h2 className="mt-6 font-medium text-[32px] leading-[1.1] tracking-[-0.025em] md:text-[40px]">
						{t("newsletter.title")}
					</h2>
					<p className="mt-6 max-w-[420px] text-[13px] text-white/75 leading-[1.7]">
						{t("newsletter.subtitle")}
					</p>
				</div>

				{form.formState.isSubmitSuccessful ? (
					<div className="flex items-start gap-3 rounded-[4px] border border-white/30 p-5">
						<CheckCircleIcon className="mt-0.5 size-5 shrink-0" />
						<div>
							<p className="font-medium text-[15px]">
								{t("newsletter.hints.success.title")}
							</p>
							<p className="mt-1 text-[12.5px] text-white/75">
								{t("newsletter.hints.success.message")}
							</p>
						</div>
					</div>
				) : (
					<form
						onSubmit={onSubmit}
						className="w-full lg:max-w-[480px] lg:justify-self-end"
					>
						<div className="flex flex-col gap-3 sm:flex-row">
							<input
								type="email"
								required
								placeholder={t("newsletter.email")}
								aria-label={t("newsletter.email")}
								className="h-[52px] w-full rounded-[4px] border border-white/30 sm:flex-1 bg-white/10 px-4 text-[13.5px] text-white placeholder:text-white/60 focus:border-white focus:outline-none"
								{...form.register("email")}
							/>
							<button
								type="submit"
								disabled={form.formState.isSubmitting}
								className="inline-flex h-[52px] items-center justify-center gap-5 rounded-[4px] bg-white px-6 font-medium text-[#1d1c1c] text-[13.5px] transition-colors hover:bg-white/90 disabled:opacity-60"
							>
								{t("newsletter.submit")}
								<ArrowRightIcon className="size-4" />
							</button>
						</div>
						{form.formState.errors.email && (
							<p className="mt-2 text-[12px] text-white/90">
								{form.formState.errors.email.message}
							</p>
						)}
					</form>
				)}
			</Container>
		</section>
	);
}
