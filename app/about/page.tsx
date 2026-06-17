import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Target, Users, Globe, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Intercontinental Crest — our mission, values, history, and the team driving global banking innovation.",
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    text: "To make world-class banking accessible to everyone, everywhere — providing secure, innovative financial services that empower individuals and businesses to achieve their goals.",
  },
  {
    icon: Users,
    title: "Our People",
    text: "Over 3,000 dedicated financial professionals across 25 global offices, committed to delivering excellence in every interaction.",
  },
  {
    icon: Globe,
    title: "Our Reach",
    text: "Operating in 50+ countries with multilingual support, multi-currency accounts, and localized financial products tailored to each market.",
  },
  {
    icon: Award,
    title: "Our Standards",
    text: "ISO 27001 certified, GDPR compliant, PCI DSS Level 1, and rated A+ by the Better Business Bureau. We set the standard for banking excellence.",
  },
];

const milestones = [
  { year: "2009", event: "Founded in New York with a vision to democratize global banking" },
  { year: "2012", event: "Expanded to Europe, serving 500,000 customers in 10 countries" },
  { year: "2016", event: "Launched mobile banking app — 1M downloads in first year" },
  { year: "2019", event: "Reached 3M customers; launched Wealth Management division" },
  { year: "2022", event: "Achieved $2B in assets under management; ISO 27001 certified" },
  { year: "2024", event: "Surpassed 5M customers across 50+ countries worldwide" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative py-24 bg-brand-secondary overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4 text-center">
            <p className="section-label mb-4">About Us</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              Banking Built on{" "}
              <span style={{ color: "#00B7F1" }}>Trust & Innovation</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Since 2009, Intercontinental Crest has been pioneering digital
              banking solutions that bridge borders, empower communities, and
              create financial opportunities for millions worldwide.
            </p>
          </div>
        </section>

        {/* Mission & Story */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="section-title mb-6">
                  The Most Profitable Banking System{" "}
                  <span className="text-brand-primary">Worldwide</span>
                </h2>
                <div className="border-l-4 border-brand-primary pl-5 mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    Intercontinental Crest continues to serve the financial needs
                    of individuals, farmers, businesses, and industries by
                    offering traditional banking products, as well as online,
                    mobile, and telephone banking products.
                  </p>
                </div>
                <p className="text-gray-500 leading-relaxed mb-8">
                  We believe that great banking should be simple, transparent,
                  and accessible to all. Our platform combines cutting-edge
                  technology with personalized service to deliver an unmatched
                  banking experience.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Strategy & Consulting",
                    "Marketing Excellence",
                    "Business Innovation",
                    "Global Partnerships",
                    "Risk Management",
                    "Digital Transformation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&q=80"
                    alt="Modern international bank building exterior"
                    width={700}
                    height={500}
                    className="w-full h-80 object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-brand-primary rounded-2xl p-5 text-white shadow-xl">
                  <div className="font-display font-bold text-3xl">15+</div>
                  <div className="text-white/80 text-sm">Years of Banking Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <p className="section-label mb-3">Our Values</p>
              <h2 className="section-title">What Drives Us Forward</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((v) => (
                <div key={v.title} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                      <v.icon className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-brand-secondary text-lg mb-2">{v.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{v.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-brand-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <p className="section-label mb-3">Our Journey</p>
              <h2 className="section-title-white">15 Years of Growth</h2>
            </div>
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-px h-full w-0.5 bg-brand-primary/30 hidden md:block" />
              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <div key={m.year} className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 inline-block">
                        <div className="font-display font-bold text-brand-primary text-lg mb-1">{m.year}</div>
                        <div className="text-gray-300 text-sm">{m.event}</div>
                      </div>
                    </div>
                    <div className="hidden md:flex w-4 h-4 rounded-full bg-brand-primary border-4 border-brand-secondary flex-shrink-0 relative z-10" />
                    <div className="flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="section-title mb-4">Ready to Join 5M+ Customers?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm">Open your account today and experience the future of banking.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary">Open Account</Link>
              <Link href="/contact" className="btn-outline">Contact Us</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
