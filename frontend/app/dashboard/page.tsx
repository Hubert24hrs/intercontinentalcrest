"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  DollarSign, CreditCard, PiggyBank, Globe, ArrowRight, Eye, EyeOff,
  Loader2, AlertCircle, Sparkles, ChevronDown, ChevronUp, Wallet, Coins, Briefcase
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar
} from "recharts";
import { authApi, accountsApi, transactionsApi, investmentsApi, cryptoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

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

        // Optional load for investments & crypto to handle potential new users gracefully
        try {
          const invList = await investmentsApi.getMyInvestments();
          setMyInvestments(invList || []);
        } catch (e) {
          console.warn("Failed to load investments in dashboard", e);
        }

        try {
          const portfolio = await cryptoApi.getPortfolio();
          setCryptoPortfolio(portfolio);
        } catch (e) {
          console.warn("Failed to load crypto portfolio in dashboard", e);
        }

        try {
          const markets = await cryptoApi.getMarkets();
          setCryptoMarkets(markets || []);
        } catch (e) {
          console.warn("Failed to load crypto markets in dashboard", e);
        }
      } catch (err) {
        console.error("Failed to load dashboard indices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Detailed asset valuations
  const assetData = useMemo(() => {
    const checkingAcc = accounts.find((a) => a.accountType === "checking");
    const savingsAcc = accounts.find((a) => a.accountType === "savings");
    
    const checking = checkingAcc ? parseFloat(checkingAcc.availableBalance) : 0.00;
    const savings = savingsAcc ? parseFloat(savingsAcc.availableBalance) : 0.00;
    const bankingTotal = checking + savings;

    const investmentsTotal = myInvestments
      .filter((inv) => inv.status === "active")
      .reduce((sum, inv) => sum + parseFloat(inv.currentValue || inv.principalAmount), 0);

    const cryptoHoldingsList = (cryptoPortfolio?.holdings || []).map((holding: any) => {
      const coin = cryptoMarkets.find((c) => c.id === holding.coinId);
      const price = coin ? coin.current_price : parseFloat(holding.avgBuyPrice);
      const value = parseFloat(holding.quantity) * price;
      return {
        ...holding,
        coinPrice: price,
        currentValue: value
      };
    });

    const cryptoTotal = cryptoHoldingsList.reduce((sum: number, h: any) => sum + h.currentValue, 0);
    const totalAssets = bankingTotal + investmentsTotal + cryptoTotal;

    // Simulated premium indicators calculated deterministically
    const seedValue = totalAssets > 0 ? totalAssets : 1000;
    const dailyChange = seedValue * 0.0125;
    const dailyPercent = 1.25;
    const monthlyChange = seedValue * 0.064;
    const monthlyPercent = 6.40;
    const yearlyChange = seedValue * 0.191;
    const yearlyPercent = 19.10;

    return {
      checking,
      savings,
      checkingNo: checkingAcc?.accountNumber || "CK-XXXXXXXX",
      savingsNo: savingsAcc?.accountNumber || "SV-XXXXXXXX",
      bankingTotal,
      investmentsTotal,
      cryptoTotal,
      cryptoHoldingsList,
      totalAssets,
      dailyChange,
      dailyPercent,
      monthlyChange,
      monthlyPercent,
      yearlyChange,
      yearlyPercent
    };
  }, [accounts, myInvestments, cryptoPortfolio, cryptoMarkets]);

  // Group transactions for Spending Categories
  const categoryData = useMemo(() => {
    const debits = transactions.filter((t) => t.type !== "credit" && t.status === "completed");
    if (debits.length === 0) return [];

    const groups: Record<string, number> = {};
    let totalDebitAmount = 0;

    debits.forEach((d) => {
      const amt = parseFloat(d.amount);
      totalDebitAmount += amt;
      
      let category = "Transfers";
      const desc = (d.description || "").toLowerCase();
      if (desc.includes("bill") || desc.includes("electric") || desc.includes("power") || desc.includes("water")) {
        category = "Utilities";
      } else if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("sub")) {
        category = "Entertainment";
      } else if (desc.includes("grocery") || desc.includes("food") || desc.includes("store") || desc.includes("restaurant")) {
        category = "Food";
      } else if (desc.includes("crypto") || desc.includes("bitcoin") || desc.includes("purchase") || desc.includes("wallet")) {
        category = "Crypto/Asset";
      }

      groups[category] = (groups[category] || 0) + amt;
    });

    const colors = ["#00B7F1", "#0A2342", "#7DD3FC", "#10B981", "#F59E0B"];
    return Object.entries(groups).map(([name, val], idx) => ({
      name,
      value: Math.round((val / totalDebitAmount) * 100),
      color: colors[idx % colors.length]
    }));
  }, [transactions]);

  // Dynamic Net Worth Growth Trend (last 6 months)
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const now = new Date();
    
    // Create base data list
    const list = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        month: d.toLocaleString("en-US", { month: "short" }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        banking: 0,
        investments: 0,
        crypto: 0,
        netWorth: 0
      };
    });

    // Populate historical banking balances from transactions
    let tempBanking = assetData.bankingTotal;
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].banking = tempBanking;
      
      // Calculate monthly transaction delta
      let income = 0;
      let expense = 0;
      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        const amt = parseFloat(tx.amount);
        if (txDate.getMonth() === list[i].monthNum && txDate.getFullYear() === list[i].year) {
          if (tx.type === "credit") {
            income += amt;
          } else {
            expense += amt;
          }
        }
      });

      tempBanking = tempBanking - income + expense;
    }

    // Overlay active investments and crypto (historical growth simulation)
    list.forEach((item, idx) => {
      // Linear growth factor for illustration
      const growthFactor = 0.8 + (0.04 * idx); // e.g. 80% to 100%
      item.investments = parseFloat((assetData.investmentsTotal * growthFactor).toFixed(2));
      item.crypto = parseFloat((assetData.cryptoTotal * (0.75 + 0.05 * idx)).toFixed(2));
      item.netWorth = parseFloat((item.banking + item.investments + item.crypto).toFixed(2));
    });

    return list;
  }, [transactions, assetData.bankingTotal, assetData.investmentsTotal, assetData.cryptoTotal]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Connecting to secure ledger lines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.fullName || "Client"}. Here&apos;s your financial ledger.</p>
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
            New Transfer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Unified Asset ledger Card */}
      <div className="bg-gradient-to-br from-[#0A2342] via-[#0D3663] to-[#00B7F1] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Total Custody Assets (Net Worth)</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl">
                {hideBalance ? "••••••••" : `$${assetData.totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <DollarSign className="w-6 h-6 text-brand-primary" />
            </div>
          </div>

          {/* Premium Net Worth Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-white/40 block">Daily Change</span>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {hideBalance ? "•••" : `+$${assetData.dailyChange.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} (+{assetData.dailyPercent}%)
                </span>
              </div>
            </div>
            <div>
              <span className="text-white/40 block">Monthly Change</span>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {hideBalance ? "•••" : `+$${assetData.monthlyChange.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} (+{assetData.monthlyPercent}%)
                </span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-white/40 block">Yearly Growth</span>
              <div className="flex items-center gap-1 mt-0.5 font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {hideBalance ? "•••" : `+$${assetData.yearlyChange.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} (+{assetData.yearlyPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible View Details Toggle */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
            >
              {showDetails ? (
                <>
                  Hide Asset Breakdown
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View Asset Breakdown
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Asset Details breakdown */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Banking Details */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-brand-primary" />
                    Banking Assets
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.bankingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500">Checking ({assetData.checkingNo})</span>
                    <span className="font-mono text-gray-700 font-semibold">
                      {hideBalance ? "••••" : `$${assetData.checking.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500">Savings ({assetData.savingsNo})</span>
                    <span className="font-mono text-gray-700 font-semibold">
                      {hideBalance ? "••••" : `$${assetData.savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Crypto Details */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-brand-primary" />
                    Crypto Assets
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.cryptoTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="max-h-[100px] overflow-y-auto pr-1 text-xs divide-y divide-gray-50">
                  {assetData.cryptoHoldingsList.map((holding: any) => (
                    <div key={holding.id} className="py-2 flex justify-between">
                      <span className="text-gray-500">
                        {holding.coinName} ({parseFloat(holding.quantity).toFixed(4)} {holding.coinSymbol})
                      </span>
                      <span className="font-mono text-gray-700 font-semibold">
                        {hideBalance ? "••••" : `$${holding.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                  {assetData.cryptoHoldingsList.length === 0 && (
                    <div className="py-4 text-center text-[11px] text-gray-400">No crypto holdings in custody.</div>
                  )}
                </div>
                {assetData.cryptoHoldingsList.length > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-end">
                    <Link href="/dashboard/crypto" className="text-[10px] text-brand-primary font-bold hover:underline flex items-center gap-0.5">
                      Go to Marketplace <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Investment Details */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-secondary uppercase flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-brand-primary" />
                    Active Portfolios
                  </span>
                  <span className="font-mono font-bold text-brand-secondary text-sm">
                    {hideBalance ? "••••" : `$${assetData.investmentsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="max-h-[100px] overflow-y-auto pr-1 text-xs divide-y divide-gray-50">
                  {myInvestments
                    .filter((inv) => inv.status === "active")
                    .map((inv) => (
                      <div key={inv.id} className="py-2 flex justify-between">
                        <span className="text-gray-500 truncate max-w-[160px]" title={inv.planName}>
                          {inv.planName}
                        </span>
                        <span className="font-mono text-gray-700 font-semibold">
                          {hideBalance ? "••••" : `$${parseFloat(inv.currentValue || inv.principalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    ))}
                  {myInvestments.filter((inv) => inv.status === "active").length === 0 && (
                    <div className="py-4 text-center text-[11px] text-gray-400">No active investments.</div>
                  )}
                </div>
                {myInvestments.length > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-end">
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

      {transactions.length === 0 ? (
        /* Dynamic Empty State for New Customer Accounts */
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6 py-12">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-brand-secondary text-lg">Welcome to Intercontinental Crest</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Your checking and savings accounts have been successfully created and linked. 
              Since this is a fresh account, you currently have no ledger activity.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left text-xs text-gray-600 max-w-md mx-auto space-y-1">
            <div className="font-semibold text-brand-secondary mb-1">Default Provisioned Details:</div>
            <div>• Checking Account: <span className="font-mono font-bold">{assetData.checkingNo}</span></div>
            <div>• Savings Account: <span className="font-mono font-bold">{assetData.savingsNo}</span></div>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/dashboard/transfer" className="btn-primary text-sm px-6">
              Fund Account / Send Money
            </Link>
          </div>
        </div>
      ) : (
        /* Real Data Ledger & Chart Layout */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Net Worth growth line/area chart */}
            <div className="dashboard-card lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display font-bold text-brand-secondary text-base">Net Worth Growth Trend</h2>
                  <p className="text-gray-500 text-xs">Aggregated holdings (Banking + Investments + Crypto)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B7F1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00B7F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Net Worth"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#00B7F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNetWorth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Spending categories pie chart */}
            <div className="dashboard-card bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-display font-bold text-brand-secondary text-base">Expense Categories</h2>
                <p className="text-gray-500 text-xs">Debit breakdown share</p>
              </div>
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-[180px] text-xs text-gray-400">
                  No debit records logged yet.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
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
            <div className="dashboard-card lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display font-bold text-brand-secondary text-base">Income vs Expense</h2>
                  <p className="text-gray-500 text-xs">Credits vs Debits</p>
                </div>
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

            {/* Quick Actions List */}
            <div className="dashboard-card bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-display font-bold text-brand-secondary text-base mb-5">Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { label: "Send Money", href: "/dashboard/transfer", icon: ArrowUpRight, color: "text-brand-primary bg-brand-primary/10" },
                  { label: "Pay Bills", href: "/dashboard/bills", icon: CreditCard, color: "text-purple-600 bg-purple-100" },
                  { label: "Crypto Trading", href: "/dashboard/crypto", icon: Sparkles, color: "text-green-600 bg-green-100" },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
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

          {/* Ledger Table */}
          <div className="dashboard-card bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-brand-secondary text-base">Recent Ledger Operations</h2>
                <p className="text-gray-500 text-xs">Your latest account transactions</p>
              </div>
              <Link href="/dashboard/transactions" className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1">
                View All Ledger Entries <ArrowRight className="w-3.5 h-3.5" />
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
                    const date = new Date(tx.createdAt);
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-brand-secondary text-sm">{tx.description || "Fund Transfer"}</span>
                              <div className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{tx.transactionReference}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-gray-500 hidden sm:table-cell">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
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
    </div>
  );
}
