"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, Shield, Globe, TrendingUp } from "lucide-react";

export default function HeroSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=85"
            alt="Financial trading — hero background"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/95 via-brand-secondary/80 to-brand-secondary/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full border border-brand-primary/10 opacity-40 hidden xl:block" />
        <div className="absolute top-40 right-40 w-48 h-48 rounded-full border border-brand-primary/20 opacity-30 hidden xl:block" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 border border-brand-primary/30 backdrop-blur-sm text-brand-primary text-xs font-semibold mb-6">
              <Globe className="w-3.5 h-3.5" />
              Global Banking Platform
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] mb-6">
              International Banking{" "}
              <span className="block" style={{ color: "#00B7F1" }}>
                Solutions For The
              </span>
              Modern World.
            </h1>

            {/* Subheadline */}
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
              Secure digital banking, investments, savings, and lending services
              trusted by over{" "}
              <span className="text-brand-primary font-semibold">
                5 million customers
              </span>{" "}
              across 50+ countries worldwide.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link href="/register" className="btn-primary text-base px-8 py-4">
                Open Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="btn-white text-base px-8 py-4"
              >
                Learn More
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Shield, label: "Bank-Grade Security" },
                { icon: Globe, label: "50+ Countries" },
                { icon: TrendingUp, label: "5M+ Customers" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-primary" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
          aria-label="Scroll down"
        >
          <span className="text-xs font-medium tracking-widest uppercase">
            Scroll
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent" />
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* Stats Bar */}
      <div ref={scrollRef} className="bg-brand-secondary">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/10">
            {[
              { value: "5M+", label: "Trusted Customers" },
              { value: "50+", label: "Countries Served" },
              { value: "$2.4B", label: "Assets Under Management" },
              { value: "15+", label: "Years of Excellence" },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-4">
                <div className="text-2xl md:text-3xl font-display font-bold text-brand-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
