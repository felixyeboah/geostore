"use client";

import { saveStoreSettingsAction } from "@admin/actions/settings";
import { AdminSection } from "@admin/components/AdminPage";
import { AdminButton, AdminInput } from "@admin/components/ui";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	formatCedisInput,
	parseCedis,
	STORE_SETTING_FIELDS,
	type StoreSettingField,
	type StoreSettingKey,
	type StoreSettings,
} from "@repo/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type FormValues = Record<StoreSettingKey, string>;

const FIELDS_BY_KEY = new Map(
	STORE_SETTING_FIELDS.map((field) => [field.key, field]),
);

function toFormValues(settings: StoreSettings): FormValues {
	return Object.fromEntries(
		STORE_SETTING_FIELDS.map((field) => [
			field.key,
			field.unit === "cedis"
				? formatCedisInput(settings[field.key])
				: String(settings[field.key]),
		]),
	) as FormValues;
}

/** The typed value in its stored unit, or null while it is unreadable. */
function toStored(field: StoreSettingField, input: string): number | null {
	const trimmed = input.trim();

	if (field.unit === "cedis") {
		return parseCedis(trimmed);
	}

	return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/**
 * The store's operating numbers.
 *
 * Everything here changes what happens outside this screen — two of them
 * change what a customer is charged — so each field says what it does and the
 * delivery pair shows its own consequence as you type. Nothing saves until
 * you say so, and the bar at the foot only appears once something is actually
 * different from what is stored.
 */
export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
	const router = useRouter();
	const [isSaving, startSaving] = useTransition();
	const [saved, setSaved] = useState(settings);
	const [values, setValues] = useState<FormValues>(() =>
		toFormValues(settings),
	);

	const baseline = useMemo(() => toFormValues(saved), [saved]);

	// Compared as numbers, so "35" and "35.00" are the same fee rather than an
	// unsaved change that never goes away.
	const changed = STORE_SETTING_FIELDS.filter((field) => {
		const next = toStored(field, values[field.key]);
		return next === null || next !== saved[field.key];
	});
	const isDirty = changed.length > 0;
	// The server checks all of this again; disabling here just avoids a
	// round trip that can only come back as an error.
	const hasInvalid = STORE_SETTING_FIELDS.some((field) => {
		const next = toStored(field, values[field.key]);
		return next === null || next < field.min || next > field.max;
	});

	function set(key: StoreSettingKey, value: string) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	function reset() {
		setValues(baseline);
	}

	function save() {
		startSaving(async () => {
			const result = await saveStoreSettingsAction(values);

			if (!result.success) {
				toastError("Not saved", result.message);
				return;
			}

			if (result.settings) {
				setSaved(result.settings);
				setValues(toFormValues(result.settings));
			}

			toastSuccess(result.message);
			// The overview's late count and the order book's dispatch flag are
			// rendered on the server from the window that just changed.
			router.refresh();
		});
	}

	return (
		<div className="pb-24">
			<AdminSection
				title="Delivery"
				description="What the shop charges to deliver an order. It applies to the bag, the checkout and every order taken from here on — it does not change orders already placed."
			>
				<div className="divide-y divide-border border-border border-t">
					{STORE_SETTING_FIELDS.filter(
						(field) => field.unit === "cedis",
					).map((field) => (
						<SettingRow
							key={field.key}
							field={field}
							value={values[field.key]}
							onChange={(value) => set(field.key, value)}
						/>
					))}
				</div>
				<DeliveryPreview values={values} />
			</AdminSection>

			<AdminSection
				title="Fulfilment"
				description="How long an order may sit before the back office starts asking about it."
				className="mt-12"
			>
				<div className="divide-y divide-border border-border border-t">
					{STORE_SETTING_FIELDS.filter(
						(field) => field.unit === "hours",
					).map((field) => (
						<SettingRow
							key={field.key}
							field={field}
							value={values[field.key]}
							onChange={(value) => set(field.key, value)}
						/>
					))}
				</div>
			</AdminSection>

			{isDirty && (
				<div className="fixed inset-x-0 bottom-0 z-40 border-foreground border-t bg-background">
					<div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3.5">
						<p className="text-[13px] text-muted-foreground">
							{hasInvalid
								? "Fix the highlighted field to save."
								: changed.length === 1
									? `Unsaved change to ${FIELDS_BY_KEY.get(changed[0].key)?.label.toLowerCase()}.`
									: `${changed.length} unsaved changes.`}
						</p>
						<div className="flex items-center gap-2.5">
							<AdminButton
								size="sm"
								onClick={reset}
								disabled={isSaving}
							>
								Discard
							</AdminButton>
							<AdminButton
								size="sm"
								variant="primary"
								onClick={save}
								disabled={isSaving || hasInvalid}
							>
								{isSaving ? "Saving…" : "Save changes"}
							</AdminButton>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function SettingRow({
	field,
	value,
	onChange,
}: {
	field: StoreSettingField;
	value: string;
	onChange: (value: string) => void;
}) {
	const stored = toStored(field, value);
	const isReadable = stored !== null;
	const inRange = isReadable && stored >= field.min && stored <= field.max;
	const id = `setting-${field.key}`;

	return (
		<div className="grid gap-x-8 gap-y-3 py-5 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start">
			<div className="min-w-0">
				<label
					htmlFor={id}
					className="block font-medium text-[14px] text-foreground"
				>
					{field.label}
				</label>
				<p className="mt-1.5 max-w-[52ch] text-[13px] text-muted-foreground leading-[1.6]">
					{field.help}
				</p>
			</div>
			<div>
				<div className="flex items-center gap-2">
					{field.unit === "cedis" && (
						<span
							aria-hidden="true"
							className="shrink-0 text-[13.5px] text-muted-foreground tabular-nums"
						>
							GH₵
						</span>
					)}
					<AdminInput
						id={id}
						// `inputMode` rather than `type="number"`: a number
						// input swallows a stray scroll as an edit, which is
						// not a thing that should be able to happen to a price.
						inputMode="decimal"
						autoComplete="off"
						value={value}
						aria-invalid={!inRange}
						aria-describedby={inRange ? undefined : `${id}-error`}
						onChange={(event) => onChange(event.target.value)}
						className="text-right tabular-nums"
					/>
					{field.unit === "hours" && (
						<span
							aria-hidden="true"
							className="shrink-0 text-[13.5px] text-muted-foreground"
						>
							hours
						</span>
					)}
				</div>
				{!inRange && (
					<p
						id={`${id}-error`}
						className="mt-2 text-[12px] text-destructive"
					>
						{!isReadable
							? field.unit === "cedis"
								? "Enter an amount, like 35 or 35.50."
								: "Enter a whole number of hours."
							: field.unit === "cedis"
								? `Keep it between ${formatMoney(field.min)} and ${formatMoney(field.max)}.`
								: `Keep it between ${field.min} and ${field.max} hours.`}
					</p>
				)}
			</div>
		</div>
	);
}

/**
 * The delivery rule spelled out. Two numbers in two boxes are easy to set the
 * wrong way round, and the first person to notice would be a customer.
 */
function DeliveryPreview({ values }: { values: FormValues }) {
	const fee = parseCedis(values.deliveryFeeInPesewas.trim());
	const freeOver = parseCedis(values.freeDeliveryOverInPesewas.trim());

	if (fee === null || freeOver === null) {
		return null;
	}

	const alwaysFree = freeOver <= 0 || fee === 0;

	return (
		<div className="mt-6 border-border border-l-2 pl-5">
			<p className="eyebrow text-muted-foreground">
				What a customer pays
			</p>
			{alwaysFree ? (
				<p className="mt-3 text-[13.5px] text-foreground">
					Delivery is free on every order.
				</p>
			) : (
				<dl className="mt-3 space-y-2">
					<PreviewRow
						term={`Under ${formatMoney(freeOver)}`}
						value={formatMoney(fee)}
					/>
					<PreviewRow
						term={`${formatMoney(freeOver)} and above`}
						value="Free"
						quiet
					/>
				</dl>
			)}
		</div>
	);
}

function PreviewRow({
	term,
	value,
	quiet,
}: {
	term: string;
	value: string;
	quiet?: boolean;
}) {
	return (
		<div className="flex items-baseline justify-between gap-6 text-[13.5px]">
			<dt className="text-muted-foreground">{term}</dt>
			<dd
				className={cn(
					"font-medium tabular-nums",
					quiet ? "text-muted-foreground" : "text-foreground",
				)}
			>
				{value}
			</dd>
		</div>
	);
}
