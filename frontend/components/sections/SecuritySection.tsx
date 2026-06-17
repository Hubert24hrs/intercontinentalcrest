"use client";

import { Shield, Lock, Eye, Server, Key, AlertTriangle } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "Bank-Grade Encryption",
    description: "256-bit AES encryption protects all your data in transit and at rest.",
  },
  {
    icon: Lock,
    title: "Two-Factor Authentication",
    description: "Add an extra layer of protection to your account with TOTP or SMS 2FA.",
  },
  {
    icon: Eye,
    title: "Real-Time Fraud Monitoring",
    description: "AI-powered systems monitor every transaction 24/7 for suspicious activity.",
  },
  {
    icon: Key,
    title: "Biometric Login",
    description: "Access your account securely with fingerprint or face ID authentication.",
  },
  {
    icon: Server,
    title: "FDIC Insured",
    description: "Your deposits are federally insured up to $250,000 per account.",
  },
  {
    icon: AlertTriangle,
    title: "Instant Security Alerts",
    description: "Get immediate notifications for any unusual account activity.",
  },
];

const certifications = [
  { label: "ISO 27001", sub: "Certified" },
  { label: "PCI DSS", sub: "Level 1" },
  { label: "SOC 2", sub: "Type II" },
  { label: "GDPR", sub: "Compliant" },
];

export default function SecuritySection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Security</p>
          <h2 className="section-title max-w-2xl mx-auto mb-4">
            Your Security Is Our{" "}
            <span className="text-brand-primary">Top Priority</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            We employ multiple layers of security protocols to ensure your funds
            and personal information are always protected.
          </p>
        </div>

        {/* Security features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary flex items-center justify-center mb-4 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-display font-bold text-brand-secondary text-base mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications bar */}
        <div className="bg-brand-secondary rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="font-display font-bold text-white text-xl mb-2">
              Industry Certifications & Compliance
            </h3>
            <p className="text-gray-400 text-sm">
              Audited and certified by the world&apos;s leading security organizations.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.label}
                className="bg-white/5 rounded-2xl p-4 text-center border border-white/10 hover:border-brand-primary/50 transition-colors"
              >
                <div className="font-display font-bold text-brand-primary text-xl mb-1">
                  {cert.label}
                </div>
                <div className="text-gray-400 text-xs">{cert.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
