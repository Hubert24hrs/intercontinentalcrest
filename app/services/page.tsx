import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServicesSection from "@/components/sections/ServicesSection";
import SecuritySection from "@/components/sections/SecuritySection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Intercontinental Crest's full range of financial services — savings, checking, business banking, wealth management, and more.",
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="py-24 bg-brand-secondary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4">
            <p className="section-label mb-4">Our Services</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              Complete Financial{" "}
              <span style={{ color: "#00B7F1" }}>Services & Solutions</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              From everyday banking to sophisticated investment strategies, we
              provide a comprehensive suite of financial products tailored to
              your needs.
            </p>
            <Link href="/register" className="btn-primary inline-flex">
              Get Started Today
            </Link>
          </div>
        </section>

        <ServicesSection />
        <SecuritySection />

        {/* CTA */}
        <section className="py-16 bg-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="section-title mb-4">Can&apos;t Find What You Need?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm">
              Our team of financial experts is ready to create a custom solution for you.
            </p>
            <Link href="/contact" className="btn-primary inline-flex">Contact Our Team</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
