interface CatalogueHeaderProps {
	title: string;
	subtitle: string;
	productCount: number;
}

/**
 * The catalogue head from design/landing-v5/02-editorial.html: an eyebrow, a
 * statement, and the item count sitting on the statement's baseline at the
 * far right. The filter bar is a separate component so a page can put
 * something between them.
 */
export function CatalogueHeader({
	title,
	subtitle,
	productCount,
}: CatalogueHeaderProps) {
	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
				<div>
					<p className="eyebrow mb-4 text-muted-foreground">
						The catalogue
					</p>
					<h1 className="max-w-[16ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]">
						{title}
					</h1>
				</div>
				<p className="eyebrow whitespace-nowrap text-muted-foreground tabular-nums">
					{String(productCount).padStart(2, "0")} —{" "}
					{productCount === 1 ? "item" : "items"}
				</p>
			</div>

			<p className="mt-4 max-w-[46ch] text-[15.5px] text-muted-foreground leading-[1.62]">
				{subtitle}
			</p>
		</div>
	);
}
