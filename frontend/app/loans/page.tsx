import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoansSection from "@/components/sections/LoansSection";
import { Clock, FileText, CheckCircle2, Calculator } from "lucide-react";
import LoanCalculator from "./LoanCalculator";

export const metadata: Metadata = {
  title: "Loans",
  description:
    "Personal loans, mortgage loans, business loans, and auto loans at competitive rates. Fast approval and flexible terms.",
};

const steps = [
  { icon: FileText, title: "Apply Online", desc: "Fill out our simple online application in under 10 minutes." },
  { icon: Clock, title: "Fast Decision", desc: "Receive a lending decision within 24 hours of your application." },
  { icon: CheckCircle2, title: "Get Funded", desc: "Funds deposited to your account within 48 hours of approval." },
  { icon: Calculator, title: "Easy Repayment", desc: "Flexible repayment schedules with no prepayment penalties." },
];

export default function LoansPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="py-24 bg-brand-secondary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4">
            <p className="section-label mb-4">Loan Services</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              Smart Lending for{" "}
              <span style={{ color: "#00B7F1" }}>Every Life Stage</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Competitive rates, flexible terms, and fast approvals — designed
              around you.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="section-label mb-3">How It Works</p>
              <h2 className="section-title">Get Funded in 4 Easy Steps</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <div key={step.title} className="text-center p-6 relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-dashed border-t-2 border-dashed border-brand-primary/30" />
                  )}
                  <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                    <step.icon className="w-7 h-7 text-brand-primary" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-brand-secondary text-base mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LoansSection />

        <LoanCalculator />
      </main>
      <Footer />
    </>
  );
}
