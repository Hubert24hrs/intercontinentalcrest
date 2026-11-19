"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cryptoApi, marketApi } from "@/lib/api";
import { formatPrice, toNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

type Quote = { symbol: string; name: string; price: number; pct: number };

export function MarketTicker({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [stocks, crypto] = await Promise.allSettled([marketApi.getQuotes(), cryptoApi.getPublicMarkets()]);
      const list: Quote[] = [];
      if (stocks.status === "fulfilled" && Array.isArray(stocks.value)) {
        for (const q of stocks.value) list.push({ symbol: q.symbol || q.display, name: q.name, price: toNumber(q.price), pct: toNumber(q.pct) });
      }
      if (crypto.status === "fulfilled" && Array.isArray(crypto.value)) {
        for (const c of crypto.value.slice(0, 10)) {
          list.push({ symbol: String(c.symbol).toUpperCase(), name: c.name, price: toNumber(c.current_price), pct: toNumber(c.price_change_percentage_24h) });
        }
      }
      if (alive && list.length) setQuotes(list);
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const dark = tone === "dark";
  if (!quotes.length) {
    return <div className={cn("h-11 border-y", dark ? "border-white/10 bg-ink-950" : "border-line bg-surface")} aria-hidden />;
  }

  const items = [...quotes, ...quotes];
  return (
    <div
      className={cn("group relative overflow-hidden border-y", dark ? "border-white/10 bg-ink-950 text-white" : "border-line bg-surface text-fg")}
      aria-label="Market prices (illustrative, may be delayed)"
    >
      <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
        {items.map((q, i) => {
          const up = q.pct >= 0;
          return (
            <div key={`${q.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap px-5 py-3 text-[13px]">
              <span className="font-semibold">{q.symbol}</span>
              <span className={cn("num", dark ? "text-white/70" : "text-fg-muted")}>{formatPrice(q.price)}</span>
              <span className={cn("num inline-flex items-center gap-0.5 font-medium", up ? "text-success-600" : "text-danger-600")}>
                {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {up ? "+" : ""}
                {q.pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className={cn("pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r", dark ? "from-ink-950" : "from-surface")} />
      <div className={cn("pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l", dark ? "from-ink-950" : "from-surface")} />
    </div>
  );
}
