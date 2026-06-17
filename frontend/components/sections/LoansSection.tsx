"use client";

import Link from "next/link";
import { Calculator, Clock, CheckCircle2, ArrowRight, Percent } from "lucide-react";

const loanTypes = [
  {
    title: "Personal Loans",
    rate: "5.9%",
    period: "APR from",
    maxAmount: "$100,000",
    term: "Up to 7 years",
    features: ["No collateral required", "Fast 24hr approval", "Flexible repayment"],
    color: "from-brand-primary to-blue-400",
  },
  {
    title: "Mortgage Loans",
    rate: "3.5%",
    period: "APR from",
    maxAmount: "$2,000,000",
    term: "Up to 30 years",
    features: ["Fixed & variable rates", "Pre-approval available", "No hidden fees"],
    color: "from-brand-secondary to-brand-muted",
  },
  {
    title: "Business Loans",
    rate: "6.5%",
    period: "APR from",
    maxAmount: "$5,000,000",
    term: "Up to 10 years",
    features: ["Working capital", "Equipment financing", "Dedicated advisor"],
    color: "from-indigo-600 to-brand-primary",
  },
  {
    title: "Auto Loans",
    rate: "4.2%",
    period: "APR from",
    maxAmount: "$150,000",
    term: "Up to 7 years",
    features: ["New & used vehicles", "Same-day decision", "No prepayment penalty"],
    color: "from-teal-500 to-brand-primary",
  },
];

export default function LoansSection() {
  return (
    <section className="py-20 bg-brand-secondary overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-accent blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Loan Services</p>
          <h2 className="section-title-white max-w-2xl mx-auto mb-4">
            Smart Lending for Every{" "}
            <span style={{ color: "#00B7F1" }}>Life Stage</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Competitive rates, flexible terms, and a streamlined application
            process designed to get you funded faster.
          </p>
        </div>

        {/* Loan Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {loanTypes.map((loan) => (
            <div
              key={loan.title}
              className="group relative bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-brand-primary/50 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Rate badge */}
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${loan.color} text-white text-xs font-bold mb-4`}>
                <Percent className="w-3 h-3" />
                {loan.rate} {loan.period}
              </div>

              <h3 className="font-display font-bold text-white text-lg mb-1">
                {loan.title}
              </h3>
              <p className="text-brand-primary font-bold text-2xl mb-1">
                {loan.maxAmount}
              </p>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-5">
                <Clock className="w-3 h-3" />
                {loan.term}
              </div>

              <ul className="space-y-2 mb-6">
                {loan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/loans"
                className="flex items-center justify-center gap-1 w-full py-2.5 rounded-xl border border-brand-primary/40 text-brand-primary text-sm font-semibold group-hover:bg-brand-primary group-hover:text-white transition-all duration-300"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Loan calculator teaser */}
        <div className="bg-white/5 rounded-3xl border border-white/10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-display font-bold text-white text-xl">
                  Loan Calculator
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Estimate your monthly payments and total interest with our
                interactive loan calculator. Find the best loan terms that fit
                your budget.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
              <Link href="/loans" className="btn-primary">
                Calculate Now
                <Calculator className="w-4 h-4" />
              </Link>
              <Link
                href="/loans"
                className="px-6 py-3 rounded-full border-2 border-white/30 text-white text-sm font-semibold hover:border-white hover:bg-white/10 transition-all duration-300 text-center"
              >
                Apply Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
