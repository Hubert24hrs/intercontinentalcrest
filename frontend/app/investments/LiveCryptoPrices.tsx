"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const ICONS: Record<string, { icon: string; color: string }> = {
  bitcoin:  { icon: "🪙", color: "text-amber-500" },
  ethereum: { icon: "⟠",  color: "text-indigo-400" },
  solana:   { icon: "☀️", color: "text-cyan-400" },
};

export default function LiveCryptoPrices() {
  const [coins, setCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`${API_BASE}/crypto/markets`, { credentials: "include" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const top3 = (data as any[]).filter(c =>
          ["bitcoin", "ethereum", "solana"].includes(c.id)
        ).slice(0, 3);
        setCoins(top3);
      } catch {
        // Fallback with indicative data that's clearly labeled
        setCoins([
          { id: "bitcoin",  symbol: "BTC", name: "Bitcoin",  current_price: null, price_change_percentage_24h: null },
          { id: "ethereum", symbol: "ETH", name: "Ethereum", current_price: null, price_change_percentage_24h: null },
          { id: "solana",   symbol: "SOL", name: "Solana",   current_price: null, price_change_percentage_24h: null },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    const t = setInterval(fetchPrices, 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  const fmt = (p: number | null) =>
    p == null
      ? "Loading…"
      : p >= 10000
      ? "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {coins.map((coin) => {
        const { icon, color } = ICONS[coin.id] ?? { icon: "🔷", color: "text-blue-400" };
        const pct = coin.price_change_percentage_24h;
        return (
          <div key={coin.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <span className={`text-2xl ${color}`}>{icon}</span>
              <div>
                <div className="font-bold text-sm">{coin.name}</div>
                <div className="text-[10px] text-gray-400 font-mono">{coin.symbol?.toUpperCase()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold">{fmt(coin.current_price)}</div>
              {pct != null && (
                <div className={`text-xs font-semibold ${pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
