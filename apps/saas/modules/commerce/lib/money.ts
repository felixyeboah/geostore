const GHS_FORMATTER = new Intl.NumberFormat("en-GH", {
	style: "currency",
	currency: "GHS",
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

export function formatMoney(amountInPesewas: number): string {
	return GHS_FORMATTER.format(amountInPesewas / 100).replace("GH₵", "GH₵ ");
}
