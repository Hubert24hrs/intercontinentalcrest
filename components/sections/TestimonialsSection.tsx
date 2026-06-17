"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "James Okonkwo",
    role: "Business Owner, Lagos",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "Intercontinental Crest has transformed the way I manage my business finances. International transfers that used to take days now complete in minutes. Absolutely outstanding service.",
  },
  {
    name: "Sarah Mitchell",
    role: "Investment Manager, New York",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "The investment portfolio management tools are world-class. My wealth has grown by 23% in the past year thanks to their expert advisors and smart diversification strategies.",
  },
  {
    name: "David Chen",
    role: "Tech Entrepreneur, Singapore",
    avatar: "https://randomuser.me/api/portraits/men/68.jpg",
    rating: 5,
    text: "The security protocols are exceptional. Two-factor authentication, real-time fraud alerts, and their customer support team is always available. I feel completely safe banking here.",
  },
  {
    name: "Amina Yusuf",
    role: "Freelancer, Dubai",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 5,
    text: "As a digital nomad, I needed a bank that works everywhere. Intercontinental Crest is available in 50+ countries with zero foreign transaction fees. Game changer for my lifestyle.",
  },
  {
    name: "Michael Torres",
    role: "Doctor, Miami",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 5,
    text: "Got my home mortgage approved in under 48 hours with one of the best rates I could find anywhere. The process was seamless and the loan officer was incredibly helpful.",
  },
  {
    name: "Lisa Bergmann",
    role: "Retail Business, Berlin",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    text: "Business banking has never been this easy. The multi-currency accounts, payroll management, and expense tracking tools have saved me hours every week. Highly recommended!",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Testimonials</p>
          <h2 className="section-title max-w-2xl mx-auto mb-4">
            What Our Customers Say About{" "}
            <span className="text-brand-primary">Us</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Join millions of satisfied customers who trust Intercontinental
            Crest with their financial future.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-gray-50 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-5 right-5 opacity-10">
                <Quote className="w-10 h-10 text-brand-primary fill-brand-primary" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-5 relative z-10">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover border-2 border-brand-primary/20"
                />
                <div>
                  <div className="font-display font-bold text-brand-secondary text-sm">
                    {t.name}
                  </div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8">
          {[
            { label: "4.9/5 Rating", sub: "App Store" },
            { label: "4.8/5 Rating", sub: "Google Play" },
            { label: "A+ Rated", sub: "Better Business Bureau" },
            { label: "ISO 27001", sub: "Certified Security" },
          ].map((badge) => (
            <div key={badge.label} className="text-center">
              <div className="font-display font-bold text-brand-secondary text-lg">
                {badge.label}
              </div>
              <div className="text-gray-500 text-xs">{badge.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
