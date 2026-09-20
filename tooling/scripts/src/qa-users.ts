import { auth } from "@repo/auth";
import { createUser, createUserAccount, getUserByEmail } from "@repo/database";

const QA_USERS = [
	{
		email: "qa-admin@geostore.test",
		name: "QA Admin",
		password: "QaAdmin!2345",
		role: "admin" as const,
	},
	{
		email: "qa-buyer@geostore.test",
		name: "QA Buyer",
		password: "QaBuyer!2345",
		role: "user" as const,
	},
];

async function main() {
	const authContext = await auth.$context;

	for (const qaUser of QA_USERS) {
		const existing = await getUserByEmail(qaUser.email);

		if (existing) {
			console.info(`exists: ${qaUser.email} (${qaUser.password})`);
			continue;
		}

		const hashedPassword = await authContext.password.hash(qaUser.password);

		const user = await createUser({
			email: qaUser.email,
			name: qaUser.name,
			role: qaUser.role,
			emailVerified: true,
			onboardingComplete: true,
		});

		if (!user) {
			console.error(`failed: ${qaUser.email}`);
			continue;
		}

		await createUserAccount({
			userId: user.id,
			providerId: "credential",
			accountId: user.id,
			hashedPassword,
		});

		console.info(
			`created: ${qaUser.email} (${qaUser.password}) role=${qaUser.role}`,
		);
	}
}

main();
