import type { Locale } from "./config";

export interface MailConfig {
	/**
	 * Default sender address applied to transactional emails when a custom `from`
	 * value is not provided by the caller.
	 */
	mailFrom: string;
	/**
	 * Locale used for email content when a caller does not pass one explicitly.
	 */
	defaultLocale: Locale;
}

export interface SendEmailParams {
	to: string;
	from?: string;
	cc?: string[];
	bcc?: string[];
	replyTo?: string;
	subject: string;
	text: string;
	html?: string;
}

export type SendEmailHandler = (params: SendEmailParams) => Promise<void>;

export interface MailProvider {
	send: SendEmailHandler;
}

export type BaseMailProps = {
	locale: Locale;
	translations: any;
};
