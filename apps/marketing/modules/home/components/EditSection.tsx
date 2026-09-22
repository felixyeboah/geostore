import { formatCedis, links, productHref } from "@home/data/landing";
import { type SectionCopyProps, sectionCopy } from "@home/lib/section-copy";
import {
	Container,
	Eyebrow,
	SectionHeader,
} from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function EditSection({ copy, productLists }: SectionCopyProps) {
	const t = useTranslations();
	const c = sectionCopy(copy, t, "home.edit");

	const chosen = productLists?.productIds;
	const cards = (chosen ?? []).map((product) => ({
		key: product.id,
		href: productHref(product.slug),
		image: product.imageUrl,
		category: product.brand,
		name: product.name,
		price: formatCedis(product.priceInPesewas),
		priceHref: null,
	}));

	return (
		<section className="pb-20 lg:pb-[88px]">
			<Container>
				<SectionHeader
					eyebrow={c("eyebrow")}
					title={c("title")}
					link={{ href: links.shop, label: c("link") }}
				/>

				<ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
					{cards.map((card) => (
						<li key={card.key}>
							<ProductCard
								href={card.href}
								image={card.image}
								category={card.category}
								name={card.name}
								price={card.price}
								priceHref={card.priceHref}
							/>
						</li>
					))}
					<li>
						<GiftCard />
					</li>
				</ul>

				<p className="mt-10 text-[12px] text-muted-foreground">
					{c("note")}
				</p>
			</Container>
		</section>
	);
}

interface ProductCardProps {
	href: string;
	image: string | null;
	category: string;
	name: string;
	price: string;
	/** When set, the price row becomes its own link — a WhatsApp enquiry. */
	priceHref?: string | null;
}

/**
 * The card is no longer one large anchor. The picture and the name go to the
 * department, and the price row is a second, separate destination when there
 * is a price to ask about — an anchor cannot be nested inside another anchor,
 * so the two have to sit side by side rather than one inside the other.
 */
function ProductCard({
	href,
	image,
	category,
	name,
	price,
	priceHref,
}: ProductCardProps) {
	return (
		<div className="group">
			<Link href={href} className="block">
				<div className="relative aspect-[294/270] overflow-hidden rounded-[4px] bg-[#f2f0ee]">
					{image ? (
						<Image
							src={image}
							alt={name}
							fill
							sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
							className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
						/>
					) : (
						<span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
							Image unavailable
						</span>
					)}
				</div>
				<Eyebrow className="mt-6 text-[9.5px] text-muted-foreground">
					{category}
				</Eyebrow>
				<p className="mt-2.5 font-medium text-[17px] text-foreground">
					{name}
				</p>
			</Link>
			{priceHref ? (
				<Link
					href={priceHref}
					target="_blank"
					rel="noreferrer"
					// Named for a screen reader, which would otherwise hear
					// four identical "Contact for price" links in a row.
					aria-label={`Ask about the price of the ${name} on WhatsApp`}
					className="mt-7 flex items-center justify-between border-border border-t pt-4 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
				>
					{price}
					<PlusIcon
						className="size-4 text-foreground/70"
						strokeWidth={1.5}
					/>
				</Link>
			) : (
				<Link
					href={href}
					tabIndex={-1}
					aria-hidden="true"
					className="mt-7 flex items-center justify-between border-border border-t pt-4 text-[12px] text-muted-foreground"
				>
					{price}
					<PlusIcon
						className="size-4 text-foreground/70"
						strokeWidth={1.5}
					/>
				</Link>
			)}
		</div>
	);
}

function GiftCard() {
	const t = useTranslations();

	return (
		<Link href={links.category("gaming")} className="group block">
			<div className="relative aspect-[294/270] overflow-hidden rounded-[4px] bg-[#e9e2f0] p-6 text-[#2b2247]">
				<p className="text-[13px]">{t("home.edit.giftCard.brand")}</p>
				<svg
					aria-hidden="true"
					viewBox="0 0 120 80"
					className="absolute top-[28%] right-[6%] w-[42%] text-[#5e4e98]"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						d="M8 66 L26 56 L8 46 Z"
						transform="rotate(12 17 56)"
					/>
					<circle cx="48" cy="52" r="7" />
					<path d="M64 36 L76 48 M76 36 L64 48" />
					<rect
						x="92"
						y="16"
						width="14"
						height="14"
						transform="rotate(-18 99 23)"
					/>
				</svg>
				<div className="absolute bottom-6 left-6">
					<p className="font-medium text-[30px] leading-[1.15] tracking-[-0.03em]">
						{t("home.edit.giftCard.title1")}
						<br />
						{t("home.edit.giftCard.title2")}
					</p>
					<Eyebrow className="mt-4 text-[9px] text-[#2b2247]/70">
						{t("home.edit.giftCard.eyebrow")}
					</Eyebrow>
				</div>
			</div>
		</Link>
	);
}
