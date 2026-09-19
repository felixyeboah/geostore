import { AboutSection } from "@home/components/AboutSection";
import { AppliancesSection } from "@home/components/AppliancesSection";
import { BrandsSection } from "@home/components/BrandsSection";
import { CategoriesSection } from "@home/components/CategoriesSection";
import { ComputingSection } from "@home/components/ComputingSection";
import { DepartmentsSection } from "@home/components/DepartmentsSection";
import { EditSection } from "@home/components/EditSection";
import { EnquirySection } from "@home/components/EnquirySection";
import { GamingSection } from "@home/components/GamingSection";
import { HeroSection } from "@home/components/HeroSection";
import { KitchenBundleSection } from "@home/components/KitchenBundleSection";
import { NeedsSection } from "@home/components/NeedsSection";
import { NewsletterSection } from "@home/components/NewsletterSection";
import { ProductRail } from "@home/components/ProductRail";
import { TrustStrip } from "@home/components/TrustStrip";

export default function Home() {
	return (
		<>
			<HeroSection />
			<TrustStrip />
			<BrandsSection />
			<CategoriesSection />
			<EditSection />
			<ProductRail />
			<GamingSection />
			<ComputingSection />
			<KitchenBundleSection />
			<AppliancesSection />
			<DepartmentsSection />
			<NeedsSection />
			<AboutSection />
			<NewsletterSection />
			<EnquirySection />
		</>
	);
}
