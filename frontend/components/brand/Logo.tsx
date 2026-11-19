"use client";

import { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Crest mark: a shield split by a meridian, drawn in SVG so it stays crisp everywhere.
 * Each instance gets its own gradient id; a shared id breaks when the first copy
 * sits inside a hidden element (e.g. the desktop sidebar on a phone).
 */
export function LogoMark({ className }: { className?: string }) {
  const gid = `ic-shield-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e998e" />
          <stop offset="1" stopColor="#0b1f33" />
        </linearGradient>
      </defs>
      <path d="M20 2.5 34.5 8v11.2c0 9.1-6.1 15.7-14.5 18.3C11.6 34.9 5.5 28.3 5.5 19.2V8L20 2.5Z" fill={`url(#${gid})`} />
      <path d="M20 8.5v23.8" stroke="#e6cb91" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11.5 15.5c2.6 1.6 5.4 2.4 8.5 2.4s5.9-.8 8.5-2.4M11.5 23c2.6-1.6 5.4-2.4 8.5-2.4s5.9.8 8.5 2.4" stroke="#fff" strokeOpacity=".85" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  href = "/",
  tone = "dark",
  className,
  compact,
}: {
  href?: string;
  tone?: "dark" | "light";
  className?: string;
  compact?: boolean;
}) {
  const text = tone === "light" ? "text-white" : "text-ink-900";
  const sub = tone === "light" ? "text-gold-300" : "text-brand-600";
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Intercontinental Crest home">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("text-[13px] font-semibold tracking-[0.14em]", text)}>INTERCONTINENTAL</span>
          <span className={cn("mt-1 text-[11px] font-semibold tracking-[0.42em]", sub)}>CREST</span>
        </span>
      )}
    </Link>
  );
}
