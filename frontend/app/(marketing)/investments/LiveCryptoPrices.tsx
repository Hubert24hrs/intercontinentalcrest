"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cryptoApi } from "@/lib/api";
import { formatMoney, formatPercent, formatPrice, toNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  sparkline_in_7d?: { price: number[] } | null;
};

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data?.length) return null;
  const pts = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 40)) === 0);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${30 - ((p - min) / span) * 28 - 1}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24" preserveAspectRatio="none" aria-hidden>
      <polyline points={d} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke" className={up ? "stroke-success-500" : "stroke-danger-500"} />
    </svg>
  );
}

export default function LiveCryptoPrices() {
  const [coins, setCoins] = useState<Coin[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      cryptoApi
        .getPublicMarkets()
        .then((d) => alive && (setCoins(d), setError(false)))
        .catch(() => alive && setError(true));
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h3 className="font-semibold">Crypto markets</h3>
          <p className="text-xs text-fg-subtle">Prices refresh every minute and may be delayed.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-600">
          <span className="size-1.5 animate-pulse rounded-full bg-success-500" /> Live
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table min-w-[640px]">
          <thead>
            <tr>
              <th>Asset</th>
              <th className="text-right">Price</th>
              <th className="text-right">24h</th>
              <th className="text-right">Market cap</th>
              <th className="text-right">7 days</th>
            </tr>
          </thead>
          <tbody>
            {!coins &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}>
                    <Skeleton className="h-6" />
                  </td>
                </tr>
              ))}
            {coins?.slice(0, 10).map((c) => {
              const pct = toNumber(c.price_change_percentage_24h);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Image src={c.image} alt="" width={28} height={28} className="rounded-full" />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs uppercase text-fg-subtle">{c.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num text-right font-medium">{formatPrice(c.current_price)}</td>
                  <td className={cn("num text-right font-medium", pct >= 0 ? "text-success-600" : "text-danger-600")}>{formatPercent(pct)}</td>
                  <td className="num text-right text-fg-muted">{formatMoney(c.market_cap, { compact: true })}</td>
                  <td className="text-right">
                    <div className="flex justify-end">
                      <Sparkline data={c.sparkline_in_7d?.price || []} up={pct >= 0} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && !coins && <p className="px-6 py-4 text-sm text-fg-subtle">Market data is temporarily unavailable.</p>}
    </div>
  );
}
