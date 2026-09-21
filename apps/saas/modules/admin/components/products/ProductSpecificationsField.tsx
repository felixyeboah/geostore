"use client";

import { AdminButton, AdminInput } from "@admin/components/ui";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

interface SpecRow {
	id: number;
	label: string;
	value: string;
}

let rowId = 0;

function rowsFromRecord(specifications: Record<string, string>): SpecRow[] {
	return Object.entries(specifications).map(([label, value]) => ({
		id: ++rowId,
		label,
		value,
	}));
}

/** Rows with a label become the stored record; the first label wins a clash. */
function recordFromRows(rows: SpecRow[]): Record<string, string> {
	const record: Record<string, string> = {};
	for (const row of rows) {
		const label = row.label.trim();
		if (label && !(label in record)) {
			record[label] = row.value.trim();
		}
	}
	return record;
}

interface ProductSpecificationsFieldProps {
	value: Record<string, string>;
	onChange: (specifications: Record<string, string>) => void;
}

/**
 * The comparison table on the product page, edited as rows rather than as a
 * "Label: Value" textarea nobody could be expected to get right first time.
 * Rows are local state — a half-typed label must not vanish because the
 * record it maps to has no key for it yet.
 */
export function ProductSpecificationsField({
	value,
	onChange,
}: ProductSpecificationsFieldProps) {
	const [rows, setRows] = useState<SpecRow[]>(() => rowsFromRecord(value));

	const update = (next: SpecRow[]) => {
		setRows(next);
		onChange(recordFromRows(next));
	};

	return (
		<div className="grid gap-3">
			{rows.length > 0 ? (
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="eyebrow w-[220px] border-border border-b pb-2 text-left text-muted-foreground">
								Label
							</th>
							<th className="eyebrow border-border border-b pb-2 pl-3 text-left text-muted-foreground">
								Value
							</th>
							<th className="w-8 border-border border-b" />
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<td className="border-border border-b py-2 pr-1.5">
									<AdminInput
										inputSize="sm"
										aria-label="Specification label"
										placeholder="Display"
										value={row.label}
										onChange={(event) =>
											update(
												rows.map((r) =>
													r.id === row.id
														? {
																...r,
																label: event
																	.target
																	.value,
															}
														: r,
												),
											)
										}
									/>
								</td>
								<td className="border-border border-b py-2 pl-1.5">
									<AdminInput
										inputSize="sm"
										aria-label="Specification value"
										placeholder="Always-on Retina, up to 2000 nits"
										value={row.value}
										onChange={(event) =>
											update(
												rows.map((r) =>
													r.id === row.id
														? {
																...r,
																value: event
																	.target
																	.value,
															}
														: r,
												),
											)
										}
									/>
								</td>
								<td className="border-border border-b py-2 pl-2 text-right">
									<button
										type="button"
										aria-label={`Remove ${row.label || "row"}`}
										onClick={() =>
											update(
												rows.filter(
													(r) => r.id !== row.id,
												),
											)
										}
										className="text-muted-foreground hover:text-destructive"
									>
										<XIcon className="size-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			) : (
				<p className="text-[13px] text-muted-foreground">
					Nothing yet. Add what a buyer would compare — display,
					battery, warranty.
				</p>
			)}
			<div>
				<AdminButton
					size="sm"
					onClick={() =>
						update([...rows, { id: ++rowId, label: "", value: "" }])
					}
				>
					<PlusIcon className="size-4" /> Add a row
				</AdminButton>
			</div>
		</div>
	);
}
