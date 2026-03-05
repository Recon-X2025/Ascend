import { HeroSection } from "@/components/home/HeroSection";
import { TickerStrip } from "@/components/home/TickerStrip";
import { TrendingRolesSection } from "@/components/home/TrendingRolesSection";
import { FeaturedCompaniesSection } from "@/components/home/FeaturedCompaniesSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { WhyAscendSection } from "@/components/home/WhyAscendSection";
import { FeaturedMentorsSection } from "@/components/home/FeaturedMentorsSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CtaBand } from "@/components/home/CtaBand";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TickerStrip />
      <TrendingRolesSection />
      <FeaturedCompaniesSection />
      <FeaturesSection />
      <WhyAscendSection />
      <FeaturedMentorsSection />
      <StatsSection />
      <CtaBand />
    </>
  );
}
