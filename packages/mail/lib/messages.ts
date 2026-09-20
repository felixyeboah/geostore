import type { Locale } from "../config";
import messages from "../messages/mail.json";

export type Messages = typeof messages;

export const getMessagesForLocale = async (
	_locale?: Locale,
): Promise<Messages> => {
	return messages;
};
