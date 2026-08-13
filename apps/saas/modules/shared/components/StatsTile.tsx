"use client";

import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { useDefaultCurrency } from "@shared/hooks/currency";
import { useFormatter } from "@shared/lib/translations";
import { type PropsWithChildren, useMemo } from "react";

export function StatsTile({
	title,
	value,
	context,
	trend,
	valueFormat,
	children,
}: PropsWithChildren<{
	title: string;
	value: number;
	valueFormat: "currency" | "number" | "percentage";
	context?: string;
	icon?: React.ReactNode;
	trend?: number;
}>) {
	const format = useFormatter();
	const defaultCurrency = useDefaultCurrency();

	const formattedValue = useMemo(() => {
		// format currency
		if (valueFormat === "currency") {
			return format.number(value, {
				style: "currency",
				currency: defaultCurrency,
			});
		}
		// format percentage
		if (valueFormat === "percentage") {
			return format.number(value, {
				style: "percent",
			});
		}
		// format default number
		return format.number(value);
	}, [value, valueFormat, format, defaultCurrency]);

	const formattedTrend = useMemo(() => {
		if (!trend) {
			return null;
		}
		return `${trend >= 0 ? "+" : ""}${format.number(trend, {
			style: "percent",
		})}`;
	}, [trend, format]);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<strong className="font-semibold text-2xl lg:text-3xl">
						{formattedValue}
						{context && <small>{context}</small>}
					</strong>
					{trend && (
						<Badge status={trend > 0 ? "success" : "error"}>
							{formattedTrend}
						</Badge>
					)}
				</div>
				{children ? (
					<div className="mt-4 w-full">{children}</div>
				) : null}
			</CardContent>
		</Card>
	);
}
