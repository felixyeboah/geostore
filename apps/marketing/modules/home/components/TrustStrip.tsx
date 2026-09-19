import { Container } from "@shared/components/primitives";
import { useTranslations } from "@shared/lib/translations";
import {
	MessageCircleIcon,
	ShieldCheckIcon,
	TruckIcon,
	WalletIcon,
} from "lucide-react";

const TRUST_ITEMS = [
	{ key: "delivery", icon: TruckIcon },
	{ key: "payment", icon: WalletIcon },
	{ key: "support", icon: ShieldCheckIcon },
	{ key: "advice", icon: MessageCircleIcon },
] as const;

export function TrustStrip() {
	const t = useTranslations();

	return (
		<Container>
			<ul className="grid grid-cols-1 border-border border-b sm:grid-cols-2 lg:grid-cols-4">
				{TRUST_ITEMS.map((item, index) => (
					<li
						key={item.key}
						className="flex gap-4 border-border border-b py-6 last:border-b-0 sm:border-b-0 sm:py-7 lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0"
						data-index={index}
					>
						<item.icon
							className="mt-0.5 size-5 shrink-0 text-primary"
							strokeWidth={1.5}
						/>
						<div>
							<p className="font-medium text-[13.5px] text-foreground">
								{t(`home.trust.${item.key}.title`)}
							</p>
							<p className="mt-1.5 max-w-[230px] text-[11.5px] text-muted-foreground leading-[1.6]">
								{t(`home.trust.${item.key}.description`)}
							</p>
						</div>
					</li>
				))}
			</ul>
		</Container>
	);
}
