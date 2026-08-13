import messages from "../messages/mail.json";
import type { Locale } from "../config";

export type Messages = typeof messages;

export const getMessagesForLocale = async (
	_locale?: Locale,
): Promise<Messages> => {
	return messages;
};
