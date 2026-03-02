import { HeroSection } from "@/components/home/HeroSection";
import { TickerStrip } from "@/components/home/TickerStrip";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { WhyAscendSection } from "@/components/home/WhyAscendSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CtaBand } from "@/components/home/CtaBand";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TickerStrip />
      <FeaturesSection />
      <WhyAscendSection />
      <StatsSection />
      <CtaBand />
    </>
  );
}
