"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Helping small businesses like yours?",
    a: "We are committed to delivering value for our clients, shareholders, employees, and society at large. The mission is based on our values: integrity and openness. We offer dedicated business banking packages including working capital loans, payroll management, and multi-currency accounts specifically designed for SMEs.",
  },
  {
    q: "How do I open an account with Intercontinental Crest?",
    a: "Opening an account is quick and fully digital. Simply click 'Open Account', fill in your personal details, complete our online KYC verification (ID + selfie), and your account will be active within 24 hours. No branch visit required.",
  },
  {
    q: "What are the transfer fees for international payments?",
    a: "We offer competitive international transfer fees starting from just $5 per transaction for amounts up to $10,000. Premium account holders enjoy zero transfer fees on international payments. All transfers include real-time tracking.",
  },
  {
    q: "Is my money safe with Intercontinental Crest?",
    a: "Absolutely. All deposits are FDIC insured up to $250,000 per account. We use bank-grade 256-bit encryption, biometric authentication, and real-time fraud monitoring to keep your money and data secure 24/7.",
  },
  {
    q: "How do I apply for a loan?",
    a: "You can apply for any of our loan products entirely online. The process takes under 10 minutes: choose your loan type, enter the amount and term, submit required documents, and receive a decision within 24 hours. Most personal loans are disbursed within 48 hours of approval.",
  },
  {
    q: "What investment options do you offer?",
    a: "We offer a wide range of investment products including managed portfolios (growth, balanced, and conservative), mutual funds, ETFs, fixed-income products, and treasury bonds. All investments are managed by our team of certified financial advisors.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Accordion */}
          <div>
            <p className="section-label mb-3">FAQs</p>
            <h2 className="section-title mb-2">
              Get the Answers to
            </h2>
            <h2 className="section-title mb-8">
              Common <span className="text-brand-primary">Questions</span>
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={open === i}
                    id={`faq-btn-${i}`}
                  >
                    <span className="font-display font-semibold text-brand-secondary text-sm pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-primary flex-shrink-0 transition-transform duration-300 ${
                        open === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      open === i ? "max-h-64" : "max-h-0"
                    }`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                  >
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80"
                alt="Two business professionals discussing banking solutions"
                width={700}
                height={600}
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/20 to-transparent rounded-3xl" />
            </div>

            {/* Floating help card */}
            <div className="absolute -bottom-6 -left-6 bg-brand-secondary text-white rounded-2xl p-5 shadow-xl">
              <div className="text-2xl font-display font-bold mb-1">
                24/7 Support
              </div>
              <div className="text-gray-400 text-xs">
                Live chat, phone & email
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-300">Online now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
