import type { AuthConfig } from "./types";

/**
 * This deployment has no customer accounts. Shoppers check out as guests on the
 * storefront; the only people who sign in are staff, and the signed-in area is
 * the admin back office. Accounts are created with
 * `pnpm --filter @repo/scripts create:user`, so there is no public sign-up, and
 * no social or passkey providers to manage.
 */
export const config = {
	enableSignup: false,
	enableMagicLink: false,
	enableSocialLogin: false,
	enablePasskeys: false,
	enablePasswordLogin: true,
	enableTwoFactor: true,
	sessionCookieMaxAge: 60 * 60 * 24 * 30,
	users: {
		enableOnboarding: true,
	},
	organizations: {
		enable: false,
		hideOrganization: true,
		enableUsersToCreateOrganizations: false,
		requireOrganization: false,
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
			"organization-invitation",
			"chatbot",
		],
	},
} as const satisfies AuthConfig;
