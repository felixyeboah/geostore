import { cn } from "@repo/ui";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";

export function Container({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-[1360px] px-6 lg:px-12",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function Eyebrow({
	className,
	rule = false,
	children,
}: PropsWithChildren<{ className?: string; rule?: boolean }>) {
	return (
		<p className={cn("eyebrow flex items-center gap-3", className)}>
			{rule && (
				<span
					aria-hidden="true"
					className="h-px w-6 bg-current opacity-80"
				/>
			)}
			{children}
		</p>
	);
}

export function SectionHeading({
	className,
	children,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<h2
			className={cn(
				"font-medium text-[32px] text-foreground leading-[1.1] tracking-[-0.025em] md:text-[40px]",
				className,
			)}
		>
			{children}
		</h2>
	);
}

interface SectionHeaderProps {
	eyebrow: ReactNode;
	title: ReactNode;
	link?: { href: string; label: ReactNode };
}

export function SectionHeader({ eyebrow, title, link }: SectionHeaderProps) {
	return (
		<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
			<div>
				<Eyebrow>{eyebrow}</Eyebrow>
				<SectionHeading className="mt-6">{title}</SectionHeading>
			</div>
			{link && (
				<ArrowLink href={link.href} className="md:mb-2">
					{link.label}
				</ArrowLink>
			)}
		</div>
	);
}

export function ArrowLink({
	className,
	children,
	...props
}: ComponentProps<typeof Link>) {
	return (
		<Link
			className={cn(
				"group inline-flex items-center gap-4 font-medium text-[13px] text-foreground",
				className,
			)}
			{...props}
		>
			{children}
			<ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}
