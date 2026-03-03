import { forwardRef } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import InnovationsSection from "@/components/landing/InnovationsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Verity",
  url: "https://getverity.com.au",
  description:
    "Verified 18+ anonymous video speed dating. Real chemistry in 45 seconds. Mutual spark only. Dignity always.",
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AUD",
  },
  creator: {
    "@type": "Organization",
    name: "Verity",
    url: "https://getverity.com.au",
  },
};

const Landing = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <InnovationsSection />
      <CTASection />
      <Footer />
    </div>
  );
});
Landing.displayName = "Landing";

export default Landing;
