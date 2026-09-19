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
import { getRenderableSections } from "@home/lib/landing-sections";
import type { SectionCopyProps } from "@home/lib/section-copy";
import {
	organisationSchema,
	StructuredData,
	websiteSchema,
} from "@shared/components/StructuredData";
import { pageMetadata, SITE_DESCRIPTION } from "@shared/lib/seo";
import type { Metadata } from "next";
import type { ComponentType } from "react";

export const metadata: Metadata = pageMetadata({
	title: "Electronics and appliances, delivered in Ghana",
	description: SITE_DESCRIPTION,
	path: "/",
});

/**
 * Section key to component. The keys match `LANDING_SECTIONS` in
 * `@repo/commerce`, which is what the admin edits against.
 */
const SECTION_COMPONENTS: Record<string, ComponentType<SectionCopyProps>> = {
	hero: HeroSection,
	trust: TrustStrip,
	brands: BrandsSection,
	categories: CategoriesSection,
	edit: EditSection,
	products: ProductRail,
	gaming: GamingSection,
	computing: ComputingSection,
	kitchen: KitchenBundleSection,
	appliances: AppliancesSection,
	departments: DepartmentsSection,
	needs: NeedsSection,
	about: AboutSection,
	newsletter: NewsletterSection,
	enquiry: EnquirySection,
};

/**
 * The page reads its running order from the database, and the admin lives in a
 * separate deployment that cannot call `revalidatePath` here. Rendering per
 * request is what makes an editor's change show up immediately; it matches the
 * rest of the storefront, which is already dynamic.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
	const sections = await getRenderableSections();

	return (
		<>
			<StructuredData data={[organisationSchema(), websiteSchema()]} />
			{sections.map(({ key, copy }) => {
				const Section = SECTION_COMPONENTS[key];
				return Section ? <Section key={key} copy={copy} /> : null;
			})}
		</>
	);
}
