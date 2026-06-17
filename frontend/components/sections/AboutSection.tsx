"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Users, Award } from "lucide-react";

const checks = [
  "Strategy & Consulting",
  "Marketing Rules",
  "Business Process",
  "Partnerships",
  "Digital Innovation",
  "Risk Management",
];

export default function AboutSection() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image collage — left */}
          <div className="relative">
            {/* Primary image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&q=80"
                alt="Stacked gold coins representing financial growth"
                width={600}
                height={400}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/40 to-transparent" />
            </div>

            {/* Secondary image */}
            <div className="relative mt-4 ml-16 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80"
                alt="Financial analyst reviewing investment strategy"
                width={500}
                height={280}
                className="w-full h-44 md:h-56 object-cover"
              />
            </div>

            {/* Floating stat card */}
            <div className="absolute top-8 -right-6 bg-white rounded-2xl shadow-card-hover p-4 flex items-center gap-3 border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-2xl text-brand-secondary">
                  5M+
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Trusted Global Customers
                </div>
              </div>
            </div>

            {/* Experience badge */}
            <div className="absolute bottom-8 -left-6 bg-brand-secondary rounded-2xl p-4 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-brand-primary" />
                <div>
                  <div className="font-display font-bold text-xl">15+ Years</div>
                  <div className="text-gray-400 text-xs">Of Excellence</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content — right */}
          <div>
            <p className="section-label mb-3">About Us</p>
            <h2 className="section-title mb-6">
              The Most Profitable Banking System{" "}
              <span className="text-brand-primary">Worldwide.</span>
            </h2>

            {/* Blockquote highlight */}
            <div className="border-l-4 border-brand-primary pl-5 mb-6">
              <p className="text-gray-600 leading-relaxed">
                Intercontinental Crest continues to serve the financial needs of
                individuals, farmers, businesses, and industries by offering
                traditional banking products, as well as online, mobile and
                telephone banking products.
              </p>
            </div>

            {/* Checkmarks grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {checks.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom row: CTA + social proof */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link href="/about" className="btn-primary">
                Discover More
              </Link>

              {/* Avatar group */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[
                    "https://randomuser.me/api/portraits/men/32.jpg",
                    "https://randomuser.me/api/portraits/women/44.jpg",
                    "https://randomuser.me/api/portraits/men/68.jpg",
                    "https://randomuser.me/api/portraits/women/22.jpg",
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt={`Customer ${i + 1}`}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div>
                  <div className="font-display font-bold text-brand-secondary text-sm">
                    5M+ Trusted
                  </div>
                  <div className="text-gray-500 text-xs">Global Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
