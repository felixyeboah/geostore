"use client";

import {
	type AddressActionInput,
	deleteAddressAction,
	saveAddressAction,
} from "@commerce/actions/addresses";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	CheckIcon,
	MapPinIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface CustomerAddress extends AddressActionInput {
	id: string;
}

interface AddressManagerProps {
	addresses: CustomerAddress[];
}

const EMPTY_ADDRESS: AddressActionInput = {
	label: "Home",
	recipientName: "",
	phone: "",
	line1: "",
	line2: "",
	city: "",
	region: "Greater Accra",
	postalCode: "",
	isDefault: false,
};

export function AddressManager({ addresses }: AddressManagerProps) {
	const router = useRouter();
	const [editing, setEditing] = useState<AddressActionInput | null>(null);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [isPending, startTransition] = useTransition();

	function updateField<Key extends keyof AddressActionInput>(
		key: Key,
		value: AddressActionInput[Key],
	) {
		setEditing((current) =>
			current ? { ...current, [key]: value } : current,
		);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!editing) {
			return;
		}
		setMessage(null);
		startTransition(async () => {
			const result = await saveAddressAction(editing);
			setMessage({
				type: result.success ? "success" : "error",
				text: result.message,
			});
			if (result.success) {
				setEditing(null);
				router.refresh();
			}
		});
	}

	function handleDelete(id: string) {
		setMessage(null);
		startTransition(async () => {
			const result = await deleteAddressAction(id);
			setMessage({
				type: result.success ? "success" : "error",
				text: result.message,
			});
			if (result.success) {
				router.refresh();
			}
		});
	}

	return (
		<div>
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-xl">
						Delivery addresses
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Keep recipient and delivery details ready for checkout.
					</p>
				</div>
				{!editing && (
					<Button
						size="sm"
						onClick={() =>
							setEditing({
								...EMPTY_ADDRESS,
								isDefault: addresses.length === 0,
							})
						}
					>
						<PlusIcon className="size-4" /> Add address
					</Button>
				)}
			</div>

			{message && (
				<p
					className={`mt-5 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-destructive/10 text-destructive"}`}
				>
					{message.text}
				</p>
			)}

			{editing && (
				<form
					onSubmit={handleSubmit}
					className="mt-6 rounded-2xl border bg-card p-5"
					noValidate
				>
					<div className="flex items-center justify-between gap-4">
						<h2 className="font-semibold">
							{editing.id ? "Edit address" : "New address"}
						</h2>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={() => setEditing(null)}
							aria-label="Close address form"
						>
							<XIcon className="size-4" />
						</Button>
					</div>
					<div className="mt-5 grid gap-4 sm:grid-cols-2">
						{[
							["label", "Label", "Home"],
							["recipientName", "Recipient name", "Ama Mensah"],
							["phone", "Phone", "024 000 0000"],
							[
								"line1",
								"Address line 1",
								"House number and street",
							],
							[
								"line2",
								"Address line 2 (optional)",
								"Area or landmark",
							],
							["city", "City", "Accra"],
							["region", "Region", "Greater Accra"],
							[
								"postalCode",
								"Digital/postal address (optional)",
								"GA-000-0000",
							],
						].map(([key, label, placeholder]) => (
							<div
								key={key}
								className={
									key === "line1" || key === "line2"
										? "sm:col-span-2"
										: undefined
								}
							>
								<Label htmlFor={`address-${key}`}>
									{label}
								</Label>
								<Input
									id={`address-${key}`}
									className="mt-2"
									placeholder={placeholder}
									value={String(
										editing[
											key as keyof AddressActionInput
										] ?? "",
									)}
									required={
										!key.includes("line2") &&
										!key.includes("postalCode")
									}
									onChange={(event) =>
										updateField(
											key as keyof AddressActionInput,
											event.target.value as never,
										)
									}
								/>
							</div>
						))}
					</div>
					<label className="mt-5 flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={editing.isDefault}
							onChange={(event) =>
								updateField("isDefault", event.target.checked)
							}
						/>
						Use as my default delivery address
					</label>
					<Button type="submit" className="mt-5" disabled={isPending}>
						<CheckIcon className="size-4" />{" "}
						{isPending ? "Saving…" : "Save address"}
					</Button>
				</form>
			)}

			{addresses.length === 0 && !editing ? (
				<div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-muted/55 p-6 text-center">
					<MapPinIcon className="size-7 text-muted-foreground" />
					<h2 className="mt-4 font-semibold">No saved addresses</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Add a home, work, or pickup address for future
						purchases.
					</p>
				</div>
			) : (
				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					{addresses.map((address) => (
						<article
							key={address.id}
							className="rounded-2xl border bg-card p-5"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="flex items-center gap-2">
										<h2 className="font-semibold">
											{address.label}
										</h2>
										{address.isDefault && (
											<span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary text-[10px]">
												Default
											</span>
										)}
									</div>
									<p className="mt-3 font-medium text-sm">
										{address.recipientName}
									</p>
									<p className="mt-1 text-muted-foreground text-sm leading-6">
										{address.line1}
										{address.line2
											? `, ${address.line2}`
											: ""}
										<br />
										{address.city}, {address.region}
										<br />
										{address.phone}
									</p>
								</div>
								<MapPinIcon className="size-5 shrink-0 text-primary" />
							</div>
							<div className="mt-5 flex gap-2 border-t pt-4">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => setEditing(address)}
									disabled={isPending}
								>
									<PencilIcon className="size-3.5" /> Edit
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleDelete(address.id)}
									disabled={isPending}
								>
									<Trash2Icon className="size-3.5" /> Remove
								</Button>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
