"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calculator } from "lucide-react";

export default function LoanCalculator() {
  const [amount, setAmount] = useState(25000);
  const [rate, setRate]     = useState(5.9);
  const [term, setTerm]     = useState(60);

  const { monthly, totalInterest, totalPayment } = useMemo(() => {
    const r = rate / 100 / 12;
    if (r === 0) {
      const monthly = amount / term;
      return { monthly, totalInterest: 0, totalPayment: amount };
    }
    const monthly = (amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
    const totalPayment = monthly * term;
    const totalInterest = totalPayment - amount;
    return { monthly, totalInterest, totalPayment };
  }, [amount, rate, term]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <p className="section-label mb-3">Loan Calculator</p>
          <h2 className="section-title">Estimate Your Monthly Payment</h2>
          <p className="text-gray-500 text-sm mt-2">Adjust the sliders to calculate your estimated monthly payment.</p>
        </div>
        <div className="bg-gray-50 rounded-3xl p-8 shadow-card space-y-6">
          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-700">Loan Amount</label>
              <span className="text-sm font-bold text-brand-secondary">{fmt(amount)}</span>
            </div>
            <input type="range" min={1000} max={1000000} step={1000} value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-brand-primary" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$1,000</span><span>$1,000,000</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-700">Annual Interest Rate</label>
              <span className="text-sm font-bold text-brand-secondary">{rate.toFixed(1)}%</span>
            </div>
            <input type="range" min={1} max={30} step={0.1} value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-brand-primary" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span><span>30%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-700">Loan Term</label>
              <span className="text-sm font-bold text-brand-secondary">{term} months ({(term / 12).toFixed(1)} yrs)</span>
            </div>
            <input type="range" min={6} max={360} step={6} value={term}
              onChange={e => setTerm(Number(e.target.value))}
              className="w-full accent-brand-primary" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>6 mo</span><span>30 yrs</span>
            </div>
          </div>

          {/* Results */}
          <div className="bg-brand-secondary rounded-2xl p-5 text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-brand-primary font-display font-bold text-xl md:text-2xl">
                  {fmt(monthly)}
                </div>
                <div className="text-gray-400 text-xs mt-1">Monthly Payment</div>
              </div>
              <div>
                <div className="text-brand-accent font-display font-bold text-xl md:text-2xl">
                  {fmt(totalInterest)}
                </div>
                <div className="text-gray-400 text-xs mt-1">Total Interest</div>
              </div>
              <div>
                <div className="text-white font-display font-bold text-xl md:text-2xl">
                  {fmt(totalPayment)}
                </div>
                <div className="text-gray-400 text-xs mt-1">Total Payment</div>
              </div>
            </div>
          </div>

          <Link href="/register" className="btn-primary w-full justify-center">
            <Calculator className="w-4 h-4" /> Apply Now — Get a Real Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
