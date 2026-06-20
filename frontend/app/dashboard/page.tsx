"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  DollarSign, CreditCard, ArrowRight, Eye, EyeOff,
  Loader2, Sparkles, ChevronDown, ChevronUp, Coins, Briefcase, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { authApi, accountsApi, transactionsApi, investmentsApi, cryptoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// ── Static indicative prices for stocks / indices / commodities ───────────────
const EXTRA_TICKERS = [
  { symbol: "SPX",   name: "S&P 500",     price: 5847.32,  pct: 0.82,  group: "index"     },
  { symbol: "NDX",   name: "NASDAQ 100",  price: 20521.45, pct: 1.23,  group: "index"     },
  { symbol: "DJI",   name: "Dow Jones",   price: 42156.78, pct: 0.34,  group: "index"     },
  { symbol: "AAPL",  name: "Apple",       price: 207.83,   pct: 0.42,  group: "stock"     },
  { symbol: "TSLA",  name: "Tesla",       price: 248.50,   pct: -1.12, group: "stock"     },
  { symbol: "NVDA",  name: "NVIDIA",      price: 891.20,   pct: 2.31,  group: "stock"     },
  { symbol: "AMZN",  name: "Amazon",      price: 187.45,   pct: 0.67,  group: "stock"     },
  { symbol: "MSFT",  name: "Microsoft",   price: 421.67,   pct: 0.28,  group: "stock"     },
  { symbol: "META",  name: "Meta",        price: 512.34,   pct: 1.02,  group: "stock"     },
  { symbol: "GOOGL", name: "Alphabet",    price: 165.23,   pct: -0.45, group: "stock"     },
  { symbol: "XAU",   name: "Gold",        price: 2387.45,  pct: 0.21,  group: "commodity" },
  { symbol: "XAG",   name: "Silver",      price: 30.48,    pct: 0.54,  group: "commodity" },
  { symbol: "WTI",   name: "Crude Oil",   price: 78.82,    pct: -0.31, group: "commodity" },
  { symbol: "XPT",   name: "Platinum",    price: 1012.50,  pct: 0.12,  group: "commodity" },
  { symbol: "XPD",   name: "Palladium",   price: 945.80,   pct: -0.67, group: "commodity" },
  { symbol: "NGAS",  name: "Nat. Gas",    price: 2.45,     pct: -0.82, group: "commodity" },
];

const GROUP_ICON: Record<string, string> = {
  index: "📊",
  stock: "🏢",
  commodity: "🏅",
  crypto: "🔷",
};

// ── Inline SVG Sparkline (no library) ────────────────────────────────────────
function MiniSpark({ prices, positive, coinId }: { prices: number[]; positive: boolean; coinId: string }) {
  if (!prices?.length || prices.length < 2) return null;
  const W = 80, H = 32;
  const step = Math.max(1, Math.floor(prices.length / 28));
  const pts = Array.from({ length: Math.min(28, Math.ceil(prices.length / step)) }, (_, i) =>
    prices[Math.min(i * step, prices.length - 1)]
  );
  const mn = Math.min(...pts), mx = Math.max(...pts), range = mx - mn || 1;
  const linePath = pts.map((v, i) => {
    const x = ((i / (pts.length - 1)) * W).toFixed(1);
    const y = (H - ((v - mn) / range) * (H - 2) - 1).toFixed(1);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  const lastX = W.toFixed(1);
  const fillPath = `${linePath} L${lastX},${H} L0,${H} Z`;
  const color = positive ? "#10B981" : "#EF4444";
  const gradId = `sg-${coinId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Format price for ticker display ──────────────────────────────────────────
function fmtPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1)     return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01)  return price.toFixed(4);
  return price.toFixed(6);
}

export default function DashboardPage() {
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<any>(null);
  const [cryptoMarkets, setCryptoMarkets] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profile, accList, txListRes] = await Promise.all([
          authApi.me(),
          accountsApi.getAccounts(),
          transactionsApi.getTransactions({ limit: 6 })
        ]);
        setUser(profile);
        setAccounts(accList || []);
        setTransactions(txListRes.transactions || []);

        try {
          const invList = await investmentsApi.getMyInvestments();
          setMyInvestments(invList || []);
        } catch { /* new user */ }

        try {
          const portfolio = await cryptoApi.getPortfolio();
          setCryptoPortfolio(portfolio);
        } catch { /* new user */ }

        try {
          const markets = await cryptoApi.getMarkets();
          setCryptoMarkets(markets || []);
        } catch { /* api offline */ }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // ── Asset summary ──────────────────────────────────────────────────────────
  const assetData = useMemo(() => {
    const checkingAcc = accounts.find((a) => a.accountType === "checking");
    const savingsAcc  = accounts.find((a) => a.accountType === "savings");
    const checking    = checkingAcc ? parseFloat(checkingAcc.availableBalance) : 0;
    const savings     = savingsAcc  ? parseFloat(savingsAcc.availableBalance)  : 0;
    const bankingTotal = checking + savings;

    const investmentsTotal = myInvestments
      .filter((inv) => inv.status === "active")
      .reduce((sum, inv) => sum + parseFloat(inv.currentValue || inv.principalAmount), 0);

    const cryptoHoldingsList = (cryptoPortfolio?.holdings || []).map((h: any) => {
      const coin  = cryptoMarkets.find((c) => c.id === h.coinId);
      const price = coin ? coin.current_price : parseFloat(h.avgBuyPrice);
      return { ...h, coinPrice: price, currentValue: parseFloat(h.quantity) * price };
    });
    const cryptoTotal = cryptoHoldingsList.reduce((s: number, h: any) => s + h.currentValue, 0);

    return {
      checking, savings,
      checkingNo: checkingAcc?.accountNumber || "CK-XXXXXXXX",
      savingsNo:  savingsAcc?.accountNumber  || "SV-XXXXXXXX",
      bankingTotal, investmentsTotal, cryptoTotal,
      cryptoHoldingsList,
      totalAssets: bankingTotal + investmentsTotal + cryptoTotal,
    };
  }, [accounts, myInvestments, cryptoPortfolio, cryptoMarkets]);

  // ── Spending categories ────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const debits = transactions.filter((t) => t.type !== "credit" && t.status === "completed");
    if (!debits.length) return [];
    const groups: Record<string, number> = {};
    let total = 0;
    debits.forEach((d) => {
      const amt  = parseFloat(d.amount);
      total += amt;
      const desc = (d.description || "").toLowerCase();
      let cat = "Transfers";
      if (desc.includes("bill") || desc.includes("electric") || desc.includes("water"))  cat = "Utilities";
      else if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("sub")) cat = "Entertainment";
      else if (desc.includes("food") || desc.includes("grocery") || desc.includes("restaurant")) cat = "Food";
      else if (desc.includes("crypto") || desc.includes("bitcoin") || desc.includes("wallet"))   cat = "Crypto/Asset";
      groups[cat] = (groups[cat] || 0) + amt;
    });
    const colors = ["#00B7F1", "#0A2342", "#7DD3FC", "#10B981", "#F59E0B"];
    return Object.entries(groups).map(([name, val], i) => ({
      name, color: colors[i % colors.length],
      value: Math.round((val / total) * 100),
    }));
  }, [transactions]);

  // ── Net worth trend chart ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now  = new Date();
    const list = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return { month: d.toLocaleString("en-US", { month: "short" }), monthNum: d.getMonth(), year: d.getFullYear(), banking: 0, investments: 0, crypto: 0, netWorth: 0 };
    });
    let tempBanking = assetData.bankingTotal;
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].banking = tempBanking;
      let income = 0, expense = 0;
      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (txDate.getMonth() === list[i].monthNum && txDate.getFullYear() === list[i].year) {
          const amt = parseFloat(tx.amount);
          if (tx.type === "credit") income += amt; else expense += amt;
        }
      });
      tempBanking = tempBanking - income + expense;
    }
    list.forEach((item) => {
      item.investments = parseFloat(assetData.investmentsTotal.toFixed(2));
      item.crypto      = parseFloat(assetData.cryptoTotal.toFixed(2));
      item.netWorth    = parseFloat((item.banking + item.investments + item.crypto).toFixed(2));
    });
    return list;
  }, [transactions, assetData.bankingTotal, assetData.investmentsTotal, assetData.cryptoTotal]);

  // ── Ticker: live crypto + static stocks/commodities ────────────────────────
  const tickerItems = useMemo(() => {
    const live = cryptoMarkets.slice(0, 12).map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name:   c.name,
      price:  c.current_price,
      pct:    c.price_change_percentage_24h ?? 0,
      group:  "crypto",
      image:  c.image,
    }));
    return [...live, ...EXTRA_TICKERS.map((t) => ({ ...t, image: undefined }))];
  }, [cryptoMarkets]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Connecting to secure ledger lines…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, {user?.fullName || "Client"}. Here&apos;s your financial ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm cursor-pointer"
          >
            {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {hideBalance ? "Show" : "Hide"} Balances
          </button>
          <Link href="/dashboard/transfer" className="btn-primary text-sm px-4 py-2.5">
            New Transfer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Animated Price Ticker Strip ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#040d1a] via-[#0A2342] to-[#040d1a] border border-white/5 shadow-xl">
        {/* Fade-edge masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-[#040d1a] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#040d1a] to-transparent pointer-events-none" />

        {/* LIVE badge */}
        <div className="absolute top-2.5 right-4 z-20 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Live</span>
        </div>

        {/* Scrolling track — duplicate items for seamless loop */}
        <div
          className="flex items-center py-3 w-max animate-ticker-scroll"
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
        >
          {[...tickerItems, ...tickerItems].map((item, idx) => {
            const up = item.pct >= 0;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-5 border-r border-white/5 shrink-0 select-none"
              >
                {(item as any).image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(item as any).image}
                    alt={item.symbol}
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="text-xs leading-none">{GROUP_ICON[item.group] || "•"}</span>
                )}
                <span className="text-white/60 text-[11px] font-bold tracking-wide">{item.symbol}</span>
                <span className="text-white text-[11px] font-mono font-semibold">${fmtPrice(item.price)}</span>
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? "▲" : "▼"}{Math.abs(item.pct).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Net Worth Card ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0A2342] via-[#0D3663] to-[#00B7F1] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/3 translate-y-10 -translate-x-10" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                Total Custody Assets — Net Worth
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
                {hideBalance
                  ? "••••••••"
                  : `$${assetData.totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 flex-shrink-0">
              <DollarSign className="w-6 h-6 text-brand-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            {[
              { label: "Banking",     icon: CreditCard, val: assetData.bankingTotal },
              { label: "Investments", icon: Briefcase,  val: assetData.investmentsTotal },
              { label: "Crypto",      icon: Coins,      val: assetData.cryptoTotal },
            ].map(({ label, icon: Icon, val }) => (
              <div key={label}>
                <span className="text-white/40 block mb-0.5">{label}</span>
                <div className="flex items-center gap-1 font-semibold text-white">
                  <Icon className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                  <span>{hideBalance ? "•••" : `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
            >
              {showDetails ? <>Hide Asset Breakdown <ChevronUp className="w-3.5 h-3.5" /></> : <>View Asset Breakdown <ChevronDown className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Collapsible Asset Breakdown ────────────────────────────────────── */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Banking */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-brand-primary" />Banking Assets
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.bankingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 text-xs">
                  {[
                    { label: `Checking (${assetData.checkingNo})`, val: assetData.checking },
                    { label: `Savings (${assetData.savingsNo})`,   val: assetData.savings  },
                  ].map(({ label, val }) => (
                    <div key={label} className="py-2 flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-mono text-gray-700 font-semibold">
                        {hideBalance ? "••••" : `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crypto holdings */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-brand-primary" />Crypto Assets
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.cryptoTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto pr-1 text-xs divide-y divide-gray-50">
                  {assetData.cryptoHoldingsList.map((h: any) => (
                    <div key={h.id} className="py-2 flex justify-between">
                      <span className="text-gray-500">{h.coinName} ({parseFloat(h.quantity).toFixed(4)} {h.coinSymbol})</span>
                      <span className="font-mono text-gray-700 font-semibold">
                        {hideBalance ? "••••" : `$${h.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                  {assetData.cryptoHoldingsList.length === 0 && (
                    <div className="py-4 text-center text-[11px] text-gray-400">No crypto holdings.</div>
                  )}
                </div>
                {assetData.cryptoHoldingsList.length > 0 && (
                  <div className="pt-1 border-t border-gray-50 flex justify-end">
                    <Link href="/dashboard/crypto" className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5">
                      Go to Marketplace <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Investments */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-brand-primary" />Active Portfolios
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.investmentsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto pr-1 text-xs divide-y divide-gray-50">
                  {myInvestments.filter((i) => i.status === "active").map((inv) => (
                    <div key={inv.id} className="py-2 flex justify-between">
                      <span className="text-gray-500 truncate max-w-[140px]">{inv.planName}</span>
                      <span className="font-mono text-gray-700 font-semibold">
                        {hideBalance ? "••••" : `$${parseFloat(inv.currentValue || inv.principalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                  {myInvestments.filter((i) => i.status === "active").length === 0 && (
                    <div className="py-4 text-center text-[11px] text-gray-400">No active investments.</div>
                  )}
                </div>
                {myInvestments.length > 0 && (
                  <div className="pt-1 border-t border-gray-50 flex justify-end">
                    <Link href="/dashboard/investments" className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5">
                      Go to Portfolios <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Live Crypto Markets (always visible) ──────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-lg leading-tight">Live Crypto Markets</h2>
              <p className="text-gray-400 text-[10px]">Real-time prices via CoinGecko</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 ml-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />LIVE
            </span>
          </div>
          <Link href="/dashboard/crypto" className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1">
            Trade Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {cryptoMarkets.length === 0 ? (
          /* Skeleton loader */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-2.5 bg-gray-100 rounded w-12" />
                    <div className="h-2 bg-gray-50 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-50 rounded w-14" />
                <div className="h-7 bg-gray-50 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {cryptoMarkets.slice(0, 10).map((coin, idx) => {
              const positive      = (coin.price_change_percentage_24h ?? 0) >= 0;
              const sparkPrices   = coin.sparkline_in_7d?.price ?? [];
              const change24h     = coin.price_change_percentage_24h ?? 0;
              const borderAccent  = positive ? "hover:border-emerald-200" : "hover:border-red-200";

              return (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md ${borderAccent} transition-all group relative overflow-hidden`}
                >
                  {/* Subtle background glow */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl ${positive ? "bg-emerald-50/30" : "bg-red-50/20"}`} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coin.image}
                          alt={coin.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-brand-secondary truncate">{coin.symbol.toUpperCase()}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[56px]">{coin.name}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-50 rounded-lg px-1.5 py-0.5 flex-shrink-0">
                        #{coin.market_cap_rank}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="font-display font-extrabold text-brand-secondary text-[15px] leading-tight mb-1.5">
                      $
                      {coin.current_price >= 1
                        ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })}
                    </div>

                    {/* 24h change */}
                    <div className={`flex items-center gap-1 text-xs font-bold mb-3 ${positive ? "text-emerald-500" : "text-red-500"}`}>
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {positive ? "+" : ""}{change24h.toFixed(2)}%
                      <span className="text-gray-400 font-normal text-[10px]">24h</span>
                    </div>

                    {/* Sparkline */}
                    {sparkPrices.length > 0 ? (
                      <MiniSpark prices={sparkPrices} positive={positive} coinId={coin.id} />
                    ) : (
                      <div className={`h-7 rounded-lg ${positive ? "bg-emerald-50" : "bg-red-50"} flex items-center justify-center`}>
                        <span className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                          {positive ? "▲ Trending Up" : "▼ Trending Down"}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Market stats bar */}
        {cryptoMarkets.length > 0 && (
          <div className="bg-gradient-to-r from-[#0A2342] to-[#0D3663] rounded-2xl px-5 py-4 flex flex-wrap gap-x-8 gap-y-3 items-center">
            {cryptoMarkets.slice(0, 5).map((coin) => {
              const up = (coin.price_change_percentage_24h ?? 0) >= 0;
              return (
                <div key={coin.id} className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-white/70 text-xs font-bold">{coin.symbol.toUpperCase()}</span>
                  <span className="text-white text-xs font-mono font-semibold">${fmtPrice(coin.current_price)}</span>
                  <span className={`text-xs font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
            <Link
              href="/dashboard/crypto"
              className="ml-auto text-[11px] text-brand-primary font-bold hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
            >
              Full Market <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Charts & Ledger (only when user has transactions) ──────────────── */}
      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Net Worth area chart */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
              <div className="mb-5">
                <h2 className="font-display font-bold text-brand-secondary text-base">Net Worth Growth Trend</h2>
                <p className="text-gray-500 text-xs">Aggregated holdings (Banking + Investments + Crypto)</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00B7F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00B7F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Net Worth"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="netWorth" stroke="#00B7F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNetWorth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Expense categories */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-display font-bold text-brand-secondary text-base">Expense Categories</h2>
                <p className="text-gray-500 text-xs">Debit breakdown share</p>
              </div>
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">No debit records yet.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}%`, "Share"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 max-h-24 overflow-y-auto pr-1">
                    {categoryData.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-gray-600">{c.name}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Income vs Expense bar chart */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
              <div className="mb-5">
                <h2 className="font-display font-bold text-brand-secondary text-base">Income vs Expense</h2>
                <p className="text-gray-500 text-xs">Credits vs Debits by month</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`]} />
                  <Bar dataKey="banking" fill="#00B7F1" radius={[4, 4, 0, 0]} name="Banking" />
                  {assetData.investmentsTotal > 0 && <Bar dataKey="investments" fill="#0A2342" radius={[4, 4, 0, 0]} name="Investments" />}
                  {assetData.cryptoTotal > 0 && <Bar dataKey="crypto" fill="#10B981" radius={[4, 4, 0, 0]} name="Crypto" />}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-display font-bold text-brand-secondary text-base mb-5">Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { label: "Send Money",      href: "/dashboard/transfer",   icon: ArrowUpRight, color: "text-brand-primary bg-brand-primary/10" },
                  { label: "Pay Bills",        href: "/dashboard/bills",      icon: CreditCard,   color: "text-purple-600 bg-purple-100"          },
                  { label: "Crypto Trading",   href: "/dashboard/crypto",     icon: Sparkles,     color: "text-green-600 bg-green-100"             },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={label} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-primary transition-colors">{label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-brand-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Ledger Table */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-brand-secondary text-base">Recent Ledger Operations</h2>
                <p className="text-gray-500 text-xs">Your latest account transactions</p>
              </div>
              <Link href="/dashboard/transactions" className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 text-left font-semibold">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 pr-4 hidden sm:table-cell">Date</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit" || tx.type === "crypto_deposit";
                    const date     = new Date(tx.createdAt);
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                              {isCredit
                                ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                : <ArrowUpRight  className="w-4 h-4 text-red-500" />}
                            </div>
                            <div>
                              <span className="font-semibold text-brand-secondary text-sm">{tx.description || "Fund Transfer"}</span>
                              <div className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{tx.transactionReference}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-500 hidden sm:table-cell">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === "completed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={`py-3.5 text-right font-display font-bold text-sm ${isCredit ? "text-green-600" : "text-red-500"}`}>
                          {isCredit ? "+" : "-"}${parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New-user hint (no transactions yet) — compact, below live markets */}
      {transactions.length === 0 && (
        <div className="bg-white border border-dashed border-brand-primary/30 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-brand-secondary text-sm">Your accounts are ready</h3>
            <p className="text-gray-400 text-xs mt-1">
              Checking <span className="font-mono font-semibold text-gray-600">{assetData.checkingNo}</span> &amp;{" "}
              Savings <span className="font-mono font-semibold text-gray-600">{assetData.savingsNo}</span> are live.
              Fund your account to see ledger activity here.
            </p>
          </div>
          <Link href="/dashboard/transfer" className="btn-primary text-sm px-6 inline-flex items-center gap-2">
            Fund Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
