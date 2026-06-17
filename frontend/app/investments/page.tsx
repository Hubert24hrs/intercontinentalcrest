import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InvestmentSection from "@/components/sections/InvestmentSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investments",
  description:
    "Grow your wealth with expert investment management. Explore diversified portfolios, mutual funds, and managed investment plans.",
};

export default function InvestmentsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-24 bg-brand-secondary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4">
            <p className="section-label mb-4">Investment Solutions</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              Grow Your Wealth With{" "}
              <span style={{ color: "#00B7F1" }}>Expert Guidance</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Our world-class investment team leverages global market insights to
              deliver superior returns for your portfolio.
            </p>
            <Link href="/register" className="btn-primary inline-flex">
              Start Investing Today
            </Link>
          </div>
        </section>
        <InvestmentSection />
        <section className="py-16 bg-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="section-title mb-4">Ready to Start Your Investment Journey?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm">
              Schedule a free consultation with one of our certified financial advisors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary inline-flex">Open Investment Account</Link>
              <Link href="/contact" className="btn-outline inline-flex">Talk to an Advisor</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
