"use client";

import { getStoreOrderPaymentState } from "@commerce/actions/checkout";
import {
	EDITORIAL_BUTTON,
	EditorialContainer,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** ~10 minutes at a 3s cadence: long enough for a slow momo prompt, bounded. */
const MAX_POLL_ATTEMPTS = 200;

interface CheckoutPayStatusProps {
	orderId: string;
	orderNumber: string;
	accessToken: string;
	totalLabel: string;
	paymentMethod: string;
	initialPaymentStatus: string;
	paymentId?: string;
}

export function CheckoutPayStatus({
	orderId,
	orderNumber,
	accessToken,
	totalLabel,
	paymentMethod,
	initialPaymentStatus,
	paymentId,
}: CheckoutPayStatusProps) {
	const router = useRouter();
	const [status, setStatus] = useState(initialPaymentStatus);
	const [isChecking, setIsChecking] = useState(false);
	const [hasGivenUp, setHasGivenUp] = useState(false);
	const attemptsRef = useRef(0);

	const refreshStatus = useCallback(async () => {
		const next = await getStoreOrderPaymentState(orderId, accessToken);
		if (next?.paymentStatus) {
			setStatus(next.paymentStatus);
		}
	}, [accessToken, orderId]);

	useEffect(() => {
		if (status === "PAID") {
			router.replace(
				`/checkout/success?order=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(accessToken)}`,
			);
			return;
		}

		// A settled or abandoned payment must not keep hitting the server.
		if (status === "FAILED" || hasGivenUp) {
			return;
		}

		const intervalId = window.setInterval(() => {
			attemptsRef.current += 1;
			if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
				setHasGivenUp(true);
				return;
			}
			refreshStatus().catch(() => {
				// A transient network failure should not kill the poller.
			});
		}, 3000);

		return () => window.clearInterval(intervalId);
	}, [accessToken, hasGivenUp, orderNumber, refreshStatus, router, status]);

	async function checkNow() {
		setIsChecking(true);
		try {
			attemptsRef.current = 0;
			setHasGivenUp(false);
			await refreshStatus();
		} finally {
			setIsChecking(false);
		}
	}

	if (status === "FAILED") {
		return (
			<EditorialShell>
				<EditorialContainer className="py-20 lg:py-[120px]">
					<div className="max-w-[520px]">
						<p className="eyebrow mb-4 text-muted-foreground">
							Payment
						</p>
						<h1 className="max-w-[18ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]">
							That payment did not go through.
						</h1>
						<p className="mt-5 max-w-[46ch] text-[15.5px] text-muted-foreground leading-[1.62]">
							Order {orderNumber} was not charged, and the
							reserved items are back in stock. You can try again
							from your bag.
						</p>
						<Link
							href="/cart"
							className={`${EDITORIAL_BUTTON} mt-10`}
						>
							Back to your bag
							<ArrowRightIcon className="size-4" />
						</Link>
					</div>
				</EditorialContainer>
			</EditorialShell>
		);
	}

	return (
		<EditorialShell>
			<EditorialContainer className="py-20 lg:py-[120px]">
				<div className="max-w-[560px]">
					<p className="eyebrow mb-4 text-muted-foreground">
						Secure checkout · Step 2 of 2
					</p>
					<h1 className="max-w-[18ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]">
						Approve the payment
						<br />
						on your phone.
					</h1>
					<p className="mt-5 max-w-[46ch] text-[15.5px] text-muted-foreground leading-[1.62]">
						Approve the{" "}
						{paymentMethod === "CARD" ? "card" : "mobile money"}{" "}
						prompt for {totalLabel}. This page updates on its own as
						soon as the payment clears.
					</p>

					<dl className="mt-10 border-border border-t">
						<div className="flex items-center justify-between gap-4 border-border border-b py-4">
							<dt className="text-[12px] text-muted-foreground">
								Order
							</dt>
							<dd className="font-medium text-[13px] text-foreground tabular-nums">
								{orderNumber}
							</dd>
						</div>
						<div className="flex items-center justify-between gap-4 border-border border-b py-4">
							<dt className="text-[12px] text-muted-foreground">
								Amount
							</dt>
							<dd className="font-medium text-[13px] text-foreground tabular-nums">
								{totalLabel}
							</dd>
						</div>
						{paymentId ? (
							<div className="flex items-center justify-between gap-4 border-border border-b py-4">
								<dt className="text-[12px] text-muted-foreground">
									Payment
								</dt>
								<dd className="truncate pl-4 text-[12px] text-muted-foreground tabular-nums">
									{paymentId}
								</dd>
							</div>
						) : null}
					</dl>

					<div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
						<button
							type="button"
							onClick={checkNow}
							disabled={isChecking}
							className={`${EDITORIAL_BUTTON} disabled:opacity-60`}
						>
							{isChecking ? (
								<LoaderCircleIcon className="size-4 animate-spin" />
							) : null}
							I have paid
							<ArrowRightIcon className="size-4" />
						</button>
						<Link
							href="/cart"
							className="text-[13px] text-muted-foreground underline decoration-1 underline-offset-[3px] transition-colors hover:text-foreground"
						>
							Back to your bag
						</Link>
					</div>

					{hasGivenUp ? (
						<p className="mt-7 border-border border-t pt-5 text-[12px] text-muted-foreground">
							We stopped checking automatically. Select “I have
							paid” to refresh.
						</p>
					) : null}
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
