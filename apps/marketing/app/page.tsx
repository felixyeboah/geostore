import { FaqSection } from "@home/components/FaqSection";
import { FeaturesSection } from "@home/components/FeaturesSection";
import { HeroSection } from "@home/components/HeroSection";
import { LatestDropsSection } from "@home/components/LatestDropsSection";
import { NewsletterSection } from "@home/components/NewsletterSection";
import { PopularPicksSection } from "@home/components/PopularPicksSection";

export default function Home() {
	return (
		<>
			<HeroSection />
			<FeaturesSection />
			<LatestDropsSection />
			<PopularPicksSection />
			<FaqSection />
			<NewsletterSection />
		</>
	);
}
