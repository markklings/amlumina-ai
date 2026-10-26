import AboutSection from "../components/landing/AboutSection";
import DeveloperSection from "../components/landing/DeveloperSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HeroSection from "../components/landing/HeroSection";
import LandingFooter from "../components/landing/LandingFooter";
import LandingNav from "../components/landing/LandingNav";
import LandingLayout from "../layouts/LandingLayout";

export default function LandingPage() {
  return (
    <LandingLayout>
      <LandingNav />
      <main id="main">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <DeveloperSection />
      </main>
      <LandingFooter />
    </LandingLayout>
  );
}
