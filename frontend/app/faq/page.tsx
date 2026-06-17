import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FaqSection from "@/components/sections/FaqSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Intercontinental Crest — account opening, transfers, security, loans, and investments.",
};

export default function FaqPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-24 bg-brand-secondary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4">
            <p className="section-label mb-4">FAQs</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              Frequently Asked{" "}
              <span style={{ color: "#00B7F1" }}>Questions</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about banking with Intercontinental Crest.
              Can&apos;t find an answer? Contact our support team.
            </p>
          </div>
        </section>
        <FaqSection />
        <section className="py-16 bg-gray-50 text-center">
          <div className="container mx-auto px-4">
            <h2 className="section-title mb-4">Still Have Questions?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm">
              Our support team is available 24/7 to help with any questions not covered above.
            </p>
            <Link href="/contact" className="btn-primary inline-flex">Contact Support</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
