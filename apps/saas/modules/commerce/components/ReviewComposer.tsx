"use client";

import { saveReviewAction } from "@commerce/actions/reviews";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { CheckIcon, StarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const MOCK_REVIEWS_STORAGE_KEY = "geostoresgh-mock-reviews-v1";

export interface MockReview {
	id: string;
	orderId: string;
	productId: string;
	productName: string;
	rating: number;
	title: string;
	body: string;
	createdAt: string;
}

interface ReviewComposerProps {
	orderId: string;
	orderItemId?: string;
	productId: string;
	productName: string;
	onSaved: (review: MockReview) => void;
}

const reviewSchema = z.object({
	rating: z.number().int().min(1, "Choose a rating from 1 to 5."),
	title: z
		.string()
		.trim()
		.min(3, "Summarise your review in at least 3 characters.")
		.max(80, "Keep the title under 80 characters."),
	body: z
		.string()
		.trim()
		.min(15, "Share at least 15 characters about your experience.")
		.max(800, "Keep the review under 800 characters."),
});

type ReviewValues = z.infer<typeof reviewSchema>;

function readReviews(): MockReview[] {
	try {
		const storedReviews = window.localStorage.getItem(
			MOCK_REVIEWS_STORAGE_KEY,
		);
		const parsedReviews: unknown = storedReviews
			? JSON.parse(storedReviews)
			: [];
		return Array.isArray(parsedReviews)
			? (parsedReviews as MockReview[])
			: [];
	} catch {
		return [];
	}
}

export function ReviewComposer({
	orderId,
	orderItemId,
	productId,
	productName,
	onSaved,
}: ReviewComposerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const form = useForm<ReviewValues>({
		resolver: zodResolver(reviewSchema),
		defaultValues: { rating: 0, title: "", body: "" },
	});
	const rating = form.watch("rating");

	const onSubmit = form.handleSubmit(async (values) => {
		setServerError(null);
		if (orderItemId) {
			const result = await saveReviewAction({ orderItemId, ...values });
			if (!result.success) {
				setServerError(result.message);
				return;
			}
		}

		const review: MockReview = {
			id: `review-${orderId}-${productId}`,
			orderId,
			productId,
			productName,
			rating: values.rating,
			title: values.title,
			body: values.body,
			createdAt: new Date().toISOString(),
		};
		const remainingReviews = readReviews().filter(
			(item) => item.id !== review.id,
		);
		window.localStorage.setItem(
			MOCK_REVIEWS_STORAGE_KEY,
			JSON.stringify([review, ...remainingReviews]),
		);
		onSaved(review);
		setIsOpen(false);
	});

	if (!isOpen) {
		return (
			<Button
				type="button"
				size="sm"
				variant="secondary"
				onClick={() => setIsOpen(true)}
			>
				<StarIcon className="size-3.5" /> Write a review
			</Button>
		);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={onSubmit}
				className="mt-4 rounded-xl bg-muted/70 p-4"
				noValidate
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="font-semibold text-sm">
							Review {productName}
						</p>
						<p className="mt-1 text-muted-foreground text-xs">
							Your review will be labelled as a verified purchase.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-background"
						aria-label="Close review form"
					>
						<XIcon className="size-4" />
					</button>
				</div>
				{serverError && (
					<p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
						{serverError}
					</p>
				)}

				<FormField
					control={form.control}
					name="rating"
					render={() => (
						<FormItem className="mt-4">
							<FormLabel>Rating</FormLabel>
							<FormControl>
								<fieldset className="flex gap-1">
									<legend className="sr-only">
										Product rating
									</legend>
									{[1, 2, 3, 4, 5].map((value) => (
										<button
											key={value}
											type="button"
											onClick={() =>
												form.setValue("rating", value, {
													shouldValidate: true,
												})
											}
											className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
											aria-pressed={rating === value}
										>
											<StarIcon
												className={`size-6 ${value <= rating ? "fill-current text-amber-500" : "text-muted-foreground/35"}`}
											/>
										</button>
									))}
								</fieldset>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="mt-4 grid gap-4">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Review title</FormLabel>
								<FormControl>
									<Input
										placeholder="What stood out?"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="body"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Your experience</FormLabel>
								<FormControl>
									<Textarea
										rows={4}
										placeholder="What should another customer know?"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Button
					type="submit"
					size="sm"
					className="mt-4"
					disabled={form.formState.isSubmitting}
				>
					<CheckIcon className="size-3.5" /> Submit review
				</Button>
			</form>
		</Form>
	);
}
