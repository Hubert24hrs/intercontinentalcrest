"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, Mail, MapPin, Phone } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Loans", href: "/loans" },
  { label: "Investments", href: "/investments" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top utility bar */}
      <div className="hidden md:block bg-brand-secondary text-white py-2">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
              Find A Location
            </span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <Mail className="w-3.5 h-3.5 text-brand-primary" />
              support@intercontinentalcrest.com
            </span>
          </div>
          <div className="flex items-center gap-3">
            {["facebook", "twitter", "instagram", "linkedin"].map((s) => (
              <a
                key={s}
                href={`https://${s}.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full bg-brand-primary/20 hover:bg-brand-primary flex items-center justify-center transition-colors"
                aria-label={s}
              >
                <Globe className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-lg shadow-brand-primary/5"
            : "bg-white"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-md">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-accent border-2 border-white"></div>
              </div>
              <div>
                <div className="font-display font-bold text-brand-secondary text-sm leading-tight">
                  INTERCONTINENTAL
                </div>
                <div className="font-display font-bold text-brand-primary text-sm leading-tight tracking-widest">
                  CREST
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-sm font-medium pb-1 ${
                    pathname === link.href
                      ? "text-brand-primary active"
                      : "text-gray-600 hover:text-brand-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
                Sign Up
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full border-2 border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-white transition-all duration-300"
              >
                Login
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-brand-secondary"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <Link href="/register" className="btn-primary flex-1 justify-center text-sm">
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2.5 rounded-full border-2 border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-white transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
