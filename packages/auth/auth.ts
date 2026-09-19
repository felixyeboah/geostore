import { passkey } from "@better-auth/passkey";
import {
	db,
	getInvitationById,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
	getUserByEmail,
	getUserById,
} from "@repo/database";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { cancelSubscription } from "@repo/payments";
import { getBaseUrl } from "@repo/utils";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import {
	admin,
	magicLink,
	openAPI,
	organization,
	twoFactor,
	username,
} from "better-auth/plugins";
import { config } from "./config";
import { updateSeatsInOrganizationSubscription } from "./lib/organization";
import { invitationOnlyPlugin } from "./plugins/invitation-only";

const appUrl = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);

/**
 * Headers trusted to carry the real client IP.
 *
 * This is a security boundary, not a convenience. Better Auth reads the *first*
 * entry of the first matching header and silently skips rate limiting when it
 * cannot resolve an IP, so the header list decides whether the limiter works at
 * all and whether a caller can pick their own bucket.
 *
 * Its default, `x-forwarded-for`, is the wrong choice behind Cloudflare.
 * Cloudflare *appends* to a client-supplied `X-Forwarded-For` rather than
 * replacing it, so the first entry is attacker-controlled: a fresh value per
 * request yields a fresh counter per request and the limiter never fires.
 * `CF-Connecting-IP` is set by the edge and overwrites anything the client
 * sent, so it is the only one we trust in production.
 *
 * `IP_ADDRESS_HEADERS` overrides this for deployments that terminate somewhere
 * other than Cloudflare. Only list headers your proxy is known to overwrite.
 */
function getTrustedIpHeaders(): string[] {
	const configured = process.env.IP_ADDRESS_HEADERS;

	if (configured) {
		return configured
			.split(",")
			.map((header) => header.trim().toLowerCase())
			.filter(Boolean);
	}

	return process.env.NODE_ENV === "production"
		? ["cf-connecting-ip"]
		: ["x-forwarded-for"];
}

export const auth = betterAuth({
	baseURL: appUrl,
	trustedOrigins: [appUrl],
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	advanced: {
		database: {
			generateId: false,
		},
		ipAddress: {
			ipAddressHeaders: getTrustedIpHeaders(),
		},
	},
	/**
	 * Enabled by default in production only, which is what we want: the limiter
	 * is a real defence in front of credential stuffing, but tripping it in local
	 * development just makes the app look broken.
	 *
	 * Storage must be "database". The default is an in-process Map, and on
	 * Workers that is one counter per isolate — the effective limit becomes the
	 * configured max multiplied by however many isolates are warm.
	 *
	 * Better Auth already ships strict defaults for `/sign-in`, `/sign-up`,
	 * `/change-password`, `/change-email` (3 per 10s) and the password-reset and
	 * verification-email sends (3 per 60s). The rules below cover the endpoints
	 * it does not: the ones where a short secret can be guessed by repetition.
	 */
	rateLimit: {
		// undefined defers to Better Auth's own default, which is "on in
		// production". RATE_LIMIT_ENABLED exists so the Playwright suite can turn
		// it off explicitly: that suite runs a production build and signs in
		// nine times over, well past the 3-per-10s default, and relying on the
		// limiter happening to no-op because no proxy sets an IP header is the
		// kind of accident that breaks the day someone adds one.
		enabled: process.env.RATE_LIMIT_ENABLED
			? process.env.RATE_LIMIT_ENABLED === "true"
			: undefined,
		storage: "database",
		customRules: {
			// A TOTP code is six digits and a backup code is short. Without a
			// limit here, second-factor verification is brute-forceable in
			// minutes once a password is known, which defeats the point of it.
			"/two-factor/*": { window: 60, max: 5 },
			// Guessing a reset token, and replaying a known-good one.
			"/reset-password": { window: 60, max: 5 },
			"/verify-email": { window: 60, max: 10 },
			// Invitation ids are the only thing standing between an outsider and
			// membership of an organisation.
			"/organization/accept-invitation": { window: 60, max: 10 },
			// Account-destroying operations; no legitimate client repeats these.
			"/delete-user": { window: 60, max: 3 },
		},
	},
	session: {
		expiresIn: config.sessionCookieMaxAge,
		// 0 disabled re-authentication entirely, so a stolen 29-day-old cookie
		// could change the account email, disable 2FA or delete the account.
		// Sensitive operations now require a session authenticated within the
		// last 15 minutes.
		freshAge: 60 * 15,
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const user = await getUserById(session.userId);
					return {
						data: {
							...session,
							activeOrganizationId:
								user?.lastActiveOrganizationId ?? null,
						},
					};
				},
			},
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "github"],
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/organization/accept-invitation")) {
				const { invitationId } = ctx.body;

				if (!invitationId) {
					return;
				}

				const invitation = await getInvitationById(invitationId);

				if (!invitation) {
					return;
				}

				await updateSeatsInOrganizationSubscription(
					invitation.organizationId,
				);
			} else if (ctx.path.startsWith("/organization/remove-member")) {
				const { organizationId } = ctx.body;

				if (!organizationId) {
					return;
				}

				await updateSeatsInOrganizationSubscription(organizationId);
			}
		}),
		before: createAuthMiddleware(async (ctx) => {
			if (
				ctx.path.startsWith("/delete-user") ||
				ctx.path.startsWith("/organization/delete")
			) {
				const userId = ctx.context.session?.session.userId;
				const { organizationId } = ctx.body;

				if (userId || organizationId) {
					const purchases = organizationId
						? await getPurchasesByOrganizationId(organizationId)
						: // biome-ignore lint/style/noNonNullAssertion: This is a valid case
							await getPurchasesByUserId(userId!);
					const subscriptions = purchases.filter(
						(purchase) =>
							purchase.type === "SUBSCRIPTION" &&
							purchase.subscriptionId !== null,
					);

					if (subscriptions.length > 0) {
						for (const subscription of subscriptions) {
							await cancelSubscription(
								// biome-ignore lint/style/noNonNullAssertion: This is a valid case
								subscription.subscriptionId!,
							);
						}
					}
				}
			}
		}),
	},
	user: {
		additionalFields: {
			onboardingComplete: {
				type: "boolean",
				required: false,
			},
			lastActiveOrganizationId: {
				type: "string",
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({
				user: { email, name },
				url,
			}) => {
				await sendEmail({
					to: email,
					templateId: "emailVerification",
					context: {
						url,
						name,
					},
				});
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		// If signup is disabled, the only way to sign up is via an invitation. So in this case we can auto sign in the user, as the email is already verified by the invitation.
		// If signup is enabled, we can't auto sign in the user, as the email is not verified yet.
		autoSignIn: !config.enableSignup,
		requireEmailVerification: config.enableSignup,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				templateId: "forgotPassword",
				context: {
					url,
					name: user.name,
				},
			});
		},
		minPasswordLength: 8,
	},
	emailVerification: {
		sendOnSignUp: config.enableSignup,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user: { email, name }, url }) => {
			await sendEmail({
				to: email,
				templateId: "emailVerification",
				context: {
					url,
					name,
				},
			});
		},
	},
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
						scope: ["email", "profile"],
					},
				}
			: {}),
		...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: process.env.GITHUB_CLIENT_ID,
						clientSecret: process.env.GITHUB_CLIENT_SECRET,
						scope: ["user:email"],
					},
				}
			: {}),
	},
	plugins: [
		username(),
		admin(),
		passkey(),
		magicLink({
			disableSignUp: false,
			sendMagicLink: async ({ email, url }) => {
				await sendEmail({
					to: email,
					templateId: "magicLink",
					context: {
						url,
					},
				});
			},
		}),
		organization({
			sendInvitationEmail: async ({ email, id, organization }) => {
				const existingUser = await getUserByEmail(email);

				const url = new URL(
					existingUser ? "/login" : "/signup",
					getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000),
				);

				url.searchParams.set("invitationId", id);
				url.searchParams.set("email", email);

				await sendEmail({
					to: email,
					templateId: "organizationInvitation",
					context: {
						organizationName: organization.name,
						url: url.toString(),
					},
				});
			},
		}),
		openAPI(),
		invitationOnlyPlugin(),
		twoFactor(),
	],
	onAPIError: {
		onError(error, ctx) {
			logger.error(error, { ctx });
		},
	},
});

export * from "./lib/organization";

export type Session = typeof auth.$Infer.Session;

export type ActiveOrganization = NonNullable<
	Awaited<ReturnType<typeof auth.api.getFullOrganization>>
>;

export type Organization = typeof auth.$Infer.Organization;

export type OrganizationMemberRole =
	ActiveOrganization["members"][number]["role"];

export type OrganizationInvitationStatus = typeof auth.$Infer.Invitation.status;

export type OrganizationMetadata = Record<string, unknown> | undefined;
