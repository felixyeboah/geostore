"use client";

import { saveReviewAction } from "@commerce/actions/reviews";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { StarIcon } from "lucide-react";
import { useState, useTransition } from "react";

const LABEL = "eyebrow block text-muted-foreground";
const FIELD =
	"mt-2.5 h-11 w-full rounded-[2px] border border-border bg-transparent px-3.5 text-[14px] text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-none";

/**
 * Leaving a review without an account.
 *
 * The shop has no customer sign-up, so the order itself is the credential:
 * the order number from the confirmation email plus the address it was sent
 * to. The server checks that pair against a delivered order containing this
 * product — nothing here is trusted.
 *
 * It stays collapsed until asked for. Most people reading a product page are
 * deciding whether to buy, not writing about something they already own.
 */
export function ReviewForm({
	productId,
	productSlug,
	productName,
}: {
	productId: string;
	productSlug: string;
	productName: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSaving, startSaving] = useTransition();
	const [rating, setRating] = useState(0);
	const [values, setValues] = useState({
		orderNumber: "",
		email: "",
		title: "",
		body: "",
	});

	const canSubmit =
		rating > 0 &&
		values.orderNumber.trim().length > 2 &&
		values.email.includes("@") &&
		values.body.trim().length >= 15;

	function submit() {
		startSaving(async () => {
			const result = await saveReviewAction({
				productId,
				productSlug,
				rating,
				orderNumber: values.orderNumber,
				email: values.email,
				title: values.title.trim() || undefined,
				body: values.body,
			});

			if (!result.success) {
				toastError("Not published", result.message);
				return;
			}

			toastSuccess(result.message);
			setValues({ orderNumber: "", email: "", title: "", body: "" });
			setRating(0);
			setIsOpen(false);
		});
	}

	if (!isOpen) {
		return (
			<div className="border-border border-t py-8">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="border-foreground border-b pb-px font-medium text-[14px] text-foreground transition-colors hover:border-transparent"
				>
					Bought this? Write a review
				</button>
				<p className="mt-2.5 max-w-[52ch] text-[13px] text-muted-foreground">
					You’ll need the order number from your confirmation email.
				</p>
			</div>
		);
	}

	return (
		<div className="border-border border-t py-9">
			<h3 className="font-semibold text-[18px] text-foreground tracking-[-0.02em]">
				Review the {productName}
			</h3>

			<fieldset className="mt-7">
				<legend className={LABEL}>Rating</legend>
				<div className="mt-2.5 flex items-center gap-1">
					{[1, 2, 3, 4, 5].map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => setRating(value)}
							aria-label={`${value} out of 5`}
							aria-pressed={rating === value}
							className="p-1 text-foreground transition-opacity hover:opacity-70"
						>
							<StarIcon
								className="size-6"
								strokeWidth={1.5}
								// Filled up to the chosen rating, so the value
								// reads at a glance rather than from the label.
								fill={value <= rating ? "currentColor" : "none"}
							/>
						</button>
					))}
				</div>
			</fieldset>

			<div className="mt-7 grid gap-5 sm:grid-cols-2">
				<div>
					<label className={LABEL} htmlFor="review-order">
						Order number
					</label>
					<input
						id="review-order"
						className={FIELD}
						autoComplete="off"
						placeholder="From your confirmation email"
						value={values.orderNumber}
						onChange={(event) =>
							setValues({
								...values,
								orderNumber: event.target.value,
							})
						}
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="review-email">
						Email on the order
					</label>
					<input
						id="review-email"
						type="email"
						className={FIELD}
						autoComplete="email"
						placeholder="you@example.com"
						value={values.email}
						onChange={(event) =>
							setValues({ ...values, email: event.target.value })
						}
					/>
				</div>
			</div>

			<div className="mt-5">
				<label className={LABEL} htmlFor="review-title">
					Headline <span className="normal-case">(optional)</span>
				</label>
				<input
					id="review-title"
					className={FIELD}
					value={values.title}
					onChange={(event) =>
						setValues({ ...values, title: event.target.value })
					}
				/>
			</div>

			<div className="mt-5">
				<label className={LABEL} htmlFor="review-body">
					Your review
				</label>
				<textarea
					id="review-body"
					rows={5}
					className="mt-2.5 w-full rounded-[2px] border border-border bg-transparent px-3.5 py-3 text-[14px] text-foreground leading-[1.6] transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-none"
					placeholder="How has it been to live with?"
					value={values.body}
					onChange={(event) =>
						setValues({ ...values, body: event.target.value })
					}
				/>
				<p className="mt-2 text-[12px] text-muted-foreground">
					At least 15 characters. Your name comes from the order —
					your email is never shown.
				</p>
			</div>

			<div className="mt-7 flex items-center gap-3">
				<button
					type="button"
					onClick={submit}
					disabled={!canSubmit || isSaving}
					className="h-11 rounded-[2px] bg-foreground px-6 font-medium text-[13.5px] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isSaving ? "Publishing…" : "Publish review"}
				</button>
				<button
					type="button"
					onClick={() => setIsOpen(false)}
					disabled={isSaving}
					className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
