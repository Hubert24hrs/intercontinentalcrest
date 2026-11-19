"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Personal", href: "/services" },
  { label: "Lending", href: "/loans" },
  { label: "Investing", href: "/investments" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/faq" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200",
        scrolled ? "border-line bg-white/90 shadow-[0_1px_0_rgba(16,24,40,0.02)] backdrop-blur-md" : "border-transparent bg-white",
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors",
                  active ? "text-ink-900" : "text-fg-muted hover:text-ink-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" variant="primary">
            Open an account
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>

        <button
          type="button"
          className="-mr-2 rounded-lg p-2 text-fg lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-line bg-white lg:hidden">
          <nav className="container-page flex flex-col py-4" aria-label="Mobile" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between border-b border-line py-4 text-lg font-medium text-fg"
              >
                {item.label}
                <ArrowRight className="size-4 text-fg-faint" />
              </Link>
            ))}
            <Link href="/contact" className="flex items-center justify-between border-b border-line py-4 text-lg font-medium text-fg">
              Contact
              <ArrowRight className="size-4 text-fg-faint" />
            </Link>
            <div className="mt-6 grid gap-3">
              <ButtonLink href="/register" variant="primary" size="lg" block>
                Open an account
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg" block>
                Sign in
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
