import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InvestmentSection from "@/components/sections/InvestmentSection";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        
        {/* Crypto Section */}
        <section className="py-20 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 rounded-full blur-3xl -z-10" />
                <div className="bg-brand-secondary/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <span className="font-display font-bold text-sm tracking-wide text-gray-400">Live Crypto Rates (USD)</span>
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full font-medium animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Live updates
                    </span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Bitcoin", symbol: "BTC", price: "$68,420.50", change: "+4.12%", icon: "🪙", color: "text-amber-500" },
                      { name: "Ethereum", symbol: "ETH", price: "$3,524.80", change: "+3.85%", icon: "⟠", color: "text-indigo-400" },
                      { name: "Solana", symbol: "SOL", price: "$152.40", change: "+7.91%", icon: "☀️", color: "text-cyan-400" },
                    ].map((coin) => (
                      <div key={coin.symbol} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl ${coin.color}`}>{coin.icon}</span>
                          <div>
                            <div className="font-bold text-sm">{coin.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{coin.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold">{coin.price}</div>
                          <div className="text-xs text-green-400 font-semibold">{coin.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link href="/register" className="text-brand-primary text-xs font-semibold hover:underline flex items-center justify-center gap-1">
                      View all 20+ coins <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="section-label mb-3">Next-Gen Digital Assets</p>
                <h2 className="section-title mb-6">
                  Secure Cryptocurrency <br />
                  <span className="text-brand-primary">Marketplace</span>
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Trade major digital currencies seamlessly using funds directly from your checking or savings accounts. Enjoy industry-leading liquidity, extremely low 0.5% trading fees, and real-time security.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    "Buy and sell instantly with your USD balances",
                    "Integrated average cost tracking and portfolio statistics",
                    "Robust institutional-grade asset storage and security",
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-sm text-gray-700">{feat}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="btn-primary">
                  Start Trading Crypto
                </Link>
              </div>
            </div>
          </div>
        </section>

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
