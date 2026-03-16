import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TechnologySection } from "@/components/landing/technology-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { BracketsSection } from "@/components/landing/brackets-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TeamSection } from "@/components/landing/team-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechnologySection />
      <MetricsSection />
      <BracketsSection />
      <PricingSection />
      <TeamSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
