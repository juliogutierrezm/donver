import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { FeaturedSpacesSection } from "@/components/sections/FeaturedSpacesSection";
import { CTASection } from "@/components/sections/CTASection";

function Index() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FeaturedSpacesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

export default Index;
