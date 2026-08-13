type TranslationParams = Record<string, string | number | boolean | null | undefined>;
type MarkupParams = Record<
	string,
	string | number | boolean | null | undefined | ((chunks: string) => string)
>;

function resolveMessage(messages: Record<string, unknown>, path: string): string {
	const value = path.split(".").reduce<unknown>((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}

		return undefined;
	}, messages);

	return typeof value === "string" ? value : path;
}

function interpolate(message: string, params?: TranslationParams | MarkupParams) {
	if (!params) {
		return message;
	}

	return message.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = params[key];
		return value == null ? "" : String(value);
	});
}

export function createTranslator({
	messages,
}: {
	locale?: string;
	messages: Record<string, unknown>;
}) {
	const t = ((path: string, params?: TranslationParams) =>
		interpolate(resolveMessage(messages, path), params)) as {
		(path: string, params?: TranslationParams): string;
		markup: (
			path: string,
			params?: MarkupParams,
		) => string;
	};

	t.markup = (path, params) => {
		let message = interpolate(resolveMessage(messages, path), params);

		for (const [key, value] of Object.entries(params ?? {})) {
			if (typeof value !== "function") {
				continue;
			}

			const render = value;
			message = message.replace(
				new RegExp(`<${key}>(.*?)</${key}>`, "g"),
				(_, chunks: string) => render(chunks),
			);
		}

		return message;
	};

	return t;
}
