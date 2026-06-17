"use client";

import Image from "next/image";
import Link from "next/link";
import { DollarSign, ArrowRight } from "lucide-react";

const services = [
  {
    title: "Secure Transactions",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500&q=80",
    alt: "Person signing financial documents",
    description: "End-to-end encrypted transfers with real-time fraud monitoring.",
    href: "/services",
  },
  {
    title: "Real Estate",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80",
    alt: "Real estate investment planning",
    description: "Finance your property dreams with competitive mortgage rates.",
    href: "/loans",
  },
  {
    title: "Digital Assets",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=500&q=80",
    alt: "Hands counting gold coins representing digital assets",
    description: "Modern portfolio management for digital and traditional assets.",
    href: "/investments",
  },
  {
    title: "Quick Loans",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80",
    alt: "Business professionals shaking hands on a loan deal",
    description: "Fast approval personal and business loans at competitive rates.",
    href: "/loans",
  },
  {
    title: "Savings Accounts",
    image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=500&q=80",
    alt: "Savings account piggy bank concept",
    description: "High-yield savings accounts with daily interest compounding.",
    href: "/services",
  },
  {
    title: "Wealth Management",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
    alt: "Wealth management advisor",
    description: "Expert financial advisors to grow and protect your wealth.",
    href: "/services",
  },
  {
    title: "Business Banking",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&q=80",
    alt: "Business team in a meeting",
    description: "Comprehensive banking solutions tailored for businesses of all sizes.",
    href: "/services",
  },
  {
    title: "Investments",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80",
    alt: "Stock market trading charts",
    description: "Diversified investment portfolios with professional management.",
    href: "/investments",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Our Services</p>
          <h2 className="section-title max-w-2xl mx-auto mb-4">
            Offering the Best Consulting &amp; Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            From everyday banking to sophisticated investment strategies, we
            provide a complete range of financial services to meet your needs.
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="service-card group"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="font-display font-bold text-brand-secondary text-base leading-tight">
                    {service.title}
                  </h3>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">
                  {service.description}
                </p>
                <div className="flex items-center gap-1 text-brand-primary text-xs font-semibold group-hover:gap-2 transition-all duration-300">
                  Learn More
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link href="/services" className="btn-outline">
            View All Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
