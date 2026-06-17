"use client";

import Link from "next/link";
import Image from "next/image";
import { TrendingUp, PieChart, BarChart2, ArrowRight, Star } from "lucide-react";

const plans = [
  {
    name: "Growth Portfolio",
    return: "8-12%",
    period: "Annual Returns",
    risk: "Moderate",
    min: "$5,000",
    features: ["Diversified equities", "Bond allocation", "Quarterly rebalancing"],
    popular: false,
  },
  {
    name: "Premium Portfolio",
    return: "12-18%",
    period: "Annual Returns",
    risk: "Moderate-High",
    min: "$25,000",
    features: ["Global equity access", "Alternative assets", "Dedicated advisor"],
    popular: true,
  },
  {
    name: "Capital Preservation",
    return: "4-7%",
    period: "Annual Returns",
    risk: "Low",
    min: "$2,500",
    features: ["Treasury bonds", "Fixed deposits", "Capital protection"],
    popular: false,
  },
];

export default function InvestmentSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Left content */}
          <div>
            <p className="section-label mb-3">Investment Solutions</p>
            <h2 className="section-title mb-6">
              Grow Your Wealth With{" "}
              <span className="text-brand-primary">Expert Guidance</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Our world-class investment management team leverages data-driven
              strategies and global market insights to deliver superior returns
              while managing risk for your portfolio.
            </p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { icon: TrendingUp, value: "$2.4B", label: "Assets Managed" },
                { icon: PieChart, value: "150+", label: "Fund Options" },
                { icon: BarChart2, value: "97%", label: "Client Retention" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div className="font-display font-bold text-2xl text-brand-secondary">
                    {value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <Link href="/investments" className="btn-primary">
              Start Investing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=700&q=80"
                alt="Stock market investment analysis"
                width={700}
                height={480}
                className="w-full h-80 object-cover"
              />
            </div>
            {/* Floating return card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-card-hover border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-display font-bold text-brand-secondary text-lg">
                    +18.4%
                  </div>
                  <div className="text-gray-500 text-xs">Avg. Annual Return</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-brand-primary bg-brand-secondary text-white shadow-glow"
                  : "border-gray-100 bg-white hover:border-brand-primary hover:shadow-card-hover"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-primary text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3
                  className={`font-display font-bold text-lg mb-1 ${
                    plan.popular ? "text-white" : "text-brand-secondary"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-display font-bold text-3xl ${
                      plan.popular ? "text-brand-primary" : "text-brand-primary"
                    }`}
                  >
                    {plan.return}
                  </span>
                  <span
                    className={`text-xs ${
                      plan.popular ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    / year
                  </span>
                </div>
              </div>
              <div
                className={`text-xs font-medium mb-1 ${
                  plan.popular ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Risk: <span className={plan.popular ? "text-brand-accent" : "text-brand-primary"}>{plan.risk}</span>
              </div>
              <div
                className={`text-xs mb-5 ${
                  plan.popular ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Min. Investment:{" "}
                <span className={`font-bold ${plan.popular ? "text-white" : "text-brand-secondary"}`}>
                  {plan.min}
                </span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-center gap-2 text-sm ${
                      plan.popular ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0"></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/investments"
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "bg-brand-primary text-white hover:bg-brand-accent"
                    : "border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
