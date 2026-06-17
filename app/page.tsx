import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ServicesSection from "@/components/sections/ServicesSection";
import InvestmentSection from "@/components/sections/InvestmentSection";
import LoansSection from "@/components/sections/LoansSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FaqSection from "@/components/sections/FaqSection";
import SecuritySection from "@/components/sections/SecuritySection";
import ContactSection from "@/components/sections/ContactSection";

export const metadata: Metadata = {
  title: "Intercontinental Crest — Global Banking. Trusted Worldwide.",
  description:
    "International banking solutions for the modern world. Secure digital banking, investments, savings, and lending services trusted by millions.",
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <InvestmentSection />
        <LoansSection />
        <TestimonialsSection />
        <FaqSection />
        <SecuritySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
