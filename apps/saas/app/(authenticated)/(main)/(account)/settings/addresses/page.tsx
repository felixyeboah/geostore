import { getSession } from "@auth/lib/server";
import { AddressManager } from "@commerce/components/AddressManager";
import { getUserStoreAddresses } from "@repo/database";
import { redirect } from "next/navigation";

export const metadata = { title: "Delivery addresses" };

export default async function AddressesPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const addresses = await getUserStoreAddresses(session.user.id);

	return (
		<AddressManager
			addresses={addresses.map((address) => ({
				id: address.id,
				label: address.label,
				recipientName: address.recipientName,
				phone: address.phone,
				line1: address.line1,
				line2: address.line2 ?? undefined,
				city: address.city,
				region: address.region,
				postalCode: address.postalCode ?? undefined,
				isDefault: address.isDefault,
			}))}
		/>
	);
}
