import Link from "next/link";
import { Globe, Mail, MapPin, Phone, ArrowRight } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Services", href: "/services" },
    { label: "Careers", href: "#" },
    { label: "Press & Media", href: "#" },
    { label: "Investor Relations", href: "#" },
  ],
  services: [
    { label: "Savings Accounts", href: "/services" },
    { label: "Checking Accounts", href: "/services" },
    { label: "Loans & Credit", href: "/loans" },
    { label: "Investments", href: "/investments" },
    { label: "Business Banking", href: "/services" },
    { label: "Wealth Management", href: "/services" },
  ],
  support: [
    { label: "Help Center", href: "/faq" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "#" },
    { label: "Accessibility", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-brand-secondary text-white">
      {/* CTA Strip */}
      <div className="bg-brand-primary/10 border-b border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display font-bold text-2xl mb-1">
                Ready to Get Started?
              </h3>
              <p className="text-gray-300 text-sm">
                Open your account today and experience banking without borders.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="btn-primary whitespace-nowrap">
                Open Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full border-2 border-white/30 text-sm font-semibold hover:border-white hover:bg-white/10 transition-all duration-300 whitespace-nowrap"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-sm leading-tight">
                  INTERCONTINENTAL
                </div>
                <div className="font-display font-bold text-brand-primary text-sm leading-tight tracking-widest">
                  CREST
                </div>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Global Banking. Trusted Worldwide. Providing secure digital
              banking and financial solutions for individuals and businesses
              across the globe.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                support@intercontinentalcrest.com
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                +1 (800) 555-CREST
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                100 Crest Tower, Financial District, NY
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-semibold text-white text-base mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-primary transition-colors duration-200 flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-brand-primary transition-all duration-300 flex-shrink-0"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-display font-semibold text-white text-base mb-5">
              Services
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-primary transition-colors duration-200 flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-brand-primary transition-all duration-300 flex-shrink-0"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Newsletter */}
          <div>
            <h4 className="font-display font-semibold text-white text-base mb-5">
              Support
            </h4>
            <ul className="space-y-3 mb-8">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-primary transition-colors duration-200 flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-brand-primary transition-all duration-300 flex-shrink-0"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Subscribe to our newsletter
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button className="px-4 py-2 bg-brand-primary rounded-lg text-sm font-medium hover:bg-brand-accent transition-colors">
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Intercontinental Crest. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              All systems operational
            </span>
            <span>FDIC Insured</span>
            <span>SSL Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
