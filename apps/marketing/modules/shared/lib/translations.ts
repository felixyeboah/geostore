import { createElement, Fragment, type ReactNode } from "react";
import messages from "../messages/marketing.json";

type TranslationParams = Record<
	string,
	string | number | boolean | null | undefined
>;
type RichParams = Record<string, (chunks: ReactNode) => ReactNode>;
type TranslationFn = {
	(path: string, params?: TranslationParams): string;
	raw: (path: string) => unknown;
	rich: (path: string, params?: RichParams) => ReactNode;
};

function resolveValue(path: string): unknown {
	return path.split(".").reduce<unknown>((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}

		return undefined;
	}, messages);
}

function resolveMessage(path: string): string {
	const value = resolveValue(path);
	return typeof value === "string" ? value : path;
}

function interpolate(message: string, params?: TranslationParams): string {
	if (!params) {
		return message;
	}

	return message.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = params[key];
		return value == null ? "" : String(value);
	});
}

export function translate(path: string, params?: TranslationParams): string {
	return interpolate(resolveMessage(path), params);
}

function renderRich(message: string, params?: RichParams): ReactNode {
	if (!params) {
		return message;
	}

	const parts: ReactNode[] = [];
	const tagPattern = /<(\w+)>(.*?)<\/\1>/g;
	let lastIndex = 0;
	let match = tagPattern.exec(message);

	while (match !== null) {
		const [fullMatch, tag, content] = match;

		if (match.index > lastIndex) {
			parts.push(message.slice(lastIndex, match.index));
		}

		const renderer = params[tag];
		parts.push(
			createElement(
				Fragment,
				{ key: `${tag}-${match.index}` },
				renderer ? renderer(content) : content,
			),
		);
		lastIndex = match.index + fullMatch.length;
		match = tagPattern.exec(message);
	}

	if (parts.length === 0) {
		return message;
	}

	if (lastIndex < message.length) {
		parts.push(message.slice(lastIndex));
	}

	return parts;
}

export function useTranslations(namespace?: string): TranslationFn {
	const t = ((path: string, params?: TranslationParams) =>
		translate(
			namespace ? `${namespace}.${path}` : path,
			params,
		)) as TranslationFn;

	t.raw = (path: string) =>
		resolveValue(namespace ? `${namespace}.${path}` : path);

	t.rich = (path: string, params?: RichParams) =>
		renderRich(
			resolveMessage(namespace ? `${namespace}.${path}` : path),
			params,
		);

	return t;
}

export async function getTranslations(
	namespaceOrOptions?: string | { namespace?: string },
) {
	const namespace =
		typeof namespaceOrOptions === "string"
			? namespaceOrOptions
			: namespaceOrOptions?.namespace;

	return useTranslations(namespace);
}

export function useFormatter() {
	return {
		number(value: number, options?: Intl.NumberFormatOptions) {
			return new Intl.NumberFormat("en", options).format(value);
		},
		dateTime(
			value: Date | number | string,
			options?: Intl.DateTimeFormatOptions,
		) {
			return new Intl.DateTimeFormat("en", options).format(
				value instanceof Date ? value : new Date(value),
			);
		},
	};
}

export function useLocale() {
	return "en";
}
