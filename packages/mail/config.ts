import type { MailConfig } from "./types";

export const config = {
	mailFrom: process.env.MAIL_FROM as string,
	defaultLocale: "en",
} satisfies MailConfig;

export type Locale = "en";
