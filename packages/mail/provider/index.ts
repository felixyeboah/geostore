import type { SendEmailHandler } from "../types";

export const send: SendEmailHandler = async (message) => {
	switch (process.env.MAIL_PROVIDER || "console") {
		case "console":
			return (await import("./console")).send(message);
		case "mailgun":
			return (await import("./mailgun")).send(message);
		case "nodemailer":
			return (await import("./nodemailer")).send(message);
		case "plunk":
			return (await import("./plunk")).send(message);
		case "postmark":
			return (await import("./postmark")).send(message);
		case "resend":
			return (await import("./resend")).send(message);
		default:
			throw new Error(
				`Unsupported mail provider: ${process.env.MAIL_PROVIDER}`,
			);
	}
};
