import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight, Lock, ShieldCheck, Smartphone } from "lucide-react";

const COLUMNS = [
  {
    title: "Banking",
    links: [
      { label: "Checking & savings", href: "/services" },
      { label: "Transfers & bill pay", href: "/services#payments" },
      { label: "Loans", href: "/loans" },
      { label: "Investing", href: "/investments" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About the platform", href: "/about" },
      { label: "Security", href: "/about#security" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/faq" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 py-12 md:flex-row md:items-center">
          <div>
            <h2 className="display text-3xl text-white sm:text-4xl">Ready to open an account?</h2>
            <p className="mt-2 text-white/60">It takes about two minutes and you can try every feature.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/register" variant="on-dark" size="lg">
              Open an account <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-on-dark" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Online banking with checking and savings accounts, payments, loans, investing and crypto in one dashboard.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <Lock className="size-4 text-brand-300" /> Encrypted connections and secure sessions
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-brand-300" /> Two factor authentication
              </li>
              <li className="flex items-center gap-2.5">
                <Smartphone className="size-4 text-brand-300" /> Designed for every screen
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 py-8 text-xs leading-relaxed text-white/45">
          <p>
            Intercontinental Crest is a demonstration platform, not a bank or a licensed financial institution. Accounts, balances,
            payments, loans, investments and crypto holdings shown here are simulated, are not deposits, and are not FDIC insured.
            Market prices are provided for illustration and may be delayed. Nothing on this site is financial advice.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Intercontinental Crest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
