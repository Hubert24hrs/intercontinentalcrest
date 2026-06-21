"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Building2,
  Layers,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Wallet,
  Clock,
  Coins,
  LineChart,
  Percent,
  X
} from "lucide-react";
import { accountsApi, investmentsApi, cryptoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface InvestmentProduct {
  id: string;
  name: string;
  category: string;
  expectedReturnRange: string;
  minReturn: number;
  maxReturn: number;
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  minInvestment: number;
  duration: string;
  termMonths: number;
  description: string;
  featuredSection: "Trending Investments" | "High Growth Opportunities" | "Most Popular Investments" | "New Investment Products" | "Diversified Portfolios";
  isTopPerformer?: boolean;
}

const investmentProducts: InvestmentProduct[] = [
  // Crypto Investments
  {
    id: "CRY-P1",
    name: "Bitcoin Investment Plans",
    category: "Crypto Investments",
    expectedReturnRange: "12.00% - 18.00%",
    minReturn: 12.0,
    maxReturn: 18.0,
    riskLevel: "High",
    minInvestment: 1000,
    duration: "12 Months",
    termMonths: 12,
    description: "Capitalize on digital gold with our structured Bitcoin yields and automatic rebalancing.",
    featuredSection: "Trending Investments",
    isTopPerformer: true
  },
  {
    id: "CRY-P2",
    name: "Ethereum Investment Plans",
    category: "Crypto Investments",
    expectedReturnRange: "10.00% - 15.00%",
    minReturn: 10.0,
    maxReturn: 15.0,
    riskLevel: "High",
    minInvestment: 500,
    duration: "6 Months",
    termMonths: 6,
    description: "Earn consistent staking rewards and growth yields on Ethereum node networks.",
    featuredSection: "Most Popular Investments"
  },
  {
    id: "CRY-P3",
    name: "Crypto Index Funds",
    category: "Crypto Investments",
    expectedReturnRange: "8.00% - 14.00%",
    minReturn: 8.0,
    maxReturn: 14.0,
    riskLevel: "High",
    minInvestment: 2500,
    duration: "24 Months",
    termMonths: 24,
    description: "A market-cap-weighted basket of the top 10 layer-1 blockchain tokens for maximum exposure.",
    featuredSection: "Diversified Portfolios"
  },
  {
    id: "CRY-P4",
    name: "Staking Products",
    category: "Crypto Investments",
    expectedReturnRange: "4.00% - 8.00%",
    minReturn: 4.0,
    maxReturn: 8.0,
    riskLevel: "Medium",
    minInvestment: 100,
    duration: "3 Months",
    termMonths: 3,
    description: "Low-risk consensus participation rewards backed by institutional validation nodes.",
    featuredSection: "New Investment Products"
  },
  {
    id: "CRY-P5",
    name: "Yield Farming Opportunities",
    category: "Crypto Investments",
    expectedReturnRange: "8.00% - 20.00%",
    minReturn: 8.0,
    maxReturn: 20.0,
    riskLevel: "Very High",
    minInvestment: 5000,
    duration: "12 Months",
    termMonths: 12,
    description: "Algorithmic liquidity provision in decentralized automated market makers with high yields.",
    featuredSection: "High Growth Opportunities",
    isTopPerformer: true
  },
  {
    id: "CRY-P6",
    name: "Stablecoin Yield Accounts",
    category: "Crypto Investments",
    expectedReturnRange: "5.00% - 7.00%",
    minReturn: 5.0,
    maxReturn: 7.0,
    riskLevel: "Low",
    minInvestment: 100,
    duration: "1 Month",
    termMonths: 1,
    description: "Dollar-pegged stablecoin loans generating interest yields with zero market price volatility risk.",
    featuredSection: "Most Popular Investments"
  },
  // Growth Stocks
  {
    id: "STK-P1",
    name: "Nvidia AI Stocks",
    category: "Growth Stocks",
    expectedReturnRange: "15.00% - 25.00%",
    minReturn: 15.0,
    maxReturn: 25.0,
    riskLevel: "High",
    minInvestment: 1000,
    duration: "12 Months",
    termMonths: 12,
    description: "Direct equity allocation in the leading AI hardware manufacturer for massive innovation growth.",
    featuredSection: "High Growth Opportunities",
    isTopPerformer: true
  },
  {
    id: "STK-P2",
    name: "Tesla Growth Plan",
    category: "Growth Stocks",
    expectedReturnRange: "12.00% - 18.00%",
    minReturn: 12.0,
    maxReturn: 18.0,
    riskLevel: "High",
    minInvestment: 500,
    duration: "6 Months",
    termMonths: 6,
    description: "Exposure to global electric vehicle production, autonomous driving research, and clean energy tech.",
    featuredSection: "Trending Investments"
  },
  // Technology ETFs
  {
    id: "ETF-P1",
    name: "Nasdaq 100 ETF",
    category: "Technology ETFs",
    expectedReturnRange: "9.00% - 13.00%",
    minReturn: 9.0,
    maxReturn: 13.0,
    riskLevel: "Medium",
    minInvestment: 200,
    duration: "12 Months",
    termMonths: 12,
    description: "Index tracking the 100 largest non-financial technology stocks listed on the Nasdaq exchange.",
    featuredSection: "Most Popular Investments"
  },
  {
    id: "ETF-P2",
    name: "Vanguard Tech ETF",
    category: "Technology ETFs",
    expectedReturnRange: "8.00% - 12.00%",
    minReturn: 8.0,
    maxReturn: 12.0,
    riskLevel: "Medium",
    minInvestment: 500,
    duration: "24 Months",
    termMonths: 24,
    description: "A low-cost fund mapping the full spectrum of software, semiconductor, and hardware equities.",
    featuredSection: "Diversified Portfolios"
  },
  // AI & Innovation Funds
  {
    id: "AI-P1",
    name: "DeepMind AI Capital",
    category: "AI & Innovation Funds",
    expectedReturnRange: "14.00% - 22.00%",
    minReturn: 14.0,
    maxReturn: 22.0,
    riskLevel: "High",
    minInvestment: 5000,
    duration: "36 Months",
    termMonths: 36,
    description: "Exclusive fund targeting early and mid-stage synthetic biology, quantum computing, and generative AI firms.",
    featuredSection: "High Growth Opportunities",
    isTopPerformer: true
  },
  {
    id: "AI-P2",
    name: "Ark Innovation Fund",
    category: "AI & Innovation Funds",
    expectedReturnRange: "12.00% - 20.00%",
    minReturn: 12.0,
    maxReturn: 20.0,
    riskLevel: "High",
    minInvestment: 2500,
    duration: "24 Months",
    termMonths: 24,
    description: "Disruptive innovation strategy focused on DNA sequencing, robotics, energy storage, and blockchain.",
    featuredSection: "Trending Investments"
  },
  // Real Estate Investments (REITs)
  {
    id: "RE-P1",
    name: "Prime Commercial REIT",
    category: "Real Estate Investments (REITs)",
    expectedReturnRange: "7.00% - 11.00%",
    minReturn: 7.0,
    maxReturn: 11.0,
    riskLevel: "Medium",
    minInvestment: 5000,
    duration: "18 Months",
    termMonths: 18,
    description: "Yield-producing real estate trust focused on major metropolitan tech offices and warehouse hubs.",
    featuredSection: "Trending Investments"
  },
  {
    id: "RE-P2",
    name: "Vanguard Real Estate",
    category: "Real Estate Investments (REITs)",
    expectedReturnRange: "6.00% - 10.00%",
    minReturn: 6.0,
    maxReturn: 10.0,
    riskLevel: "Low",
    minInvestment: 1000,
    duration: "12 Months",
    termMonths: 12,
    description: "Broad-based allocation across residential, healthcare, and retail properties for consistent dividend income.",
    featuredSection: "Diversified Portfolios"
  },
  // Private Equity Funds
  {
    id: "PE-P1",
    name: "Blackstone PE Fund",
    category: "Private Equity Funds",
    expectedReturnRange: "15.00% - 22.00%",
    minReturn: 15.0,
    maxReturn: 22.0,
    riskLevel: "High",
    minInvestment: 10000,
    duration: "36 Months",
    termMonths: 36,
    description: "Leveraged buyout strategies and growth capital in mature market-leading private corporations.",
    featuredSection: "High Growth Opportunities",
    isTopPerformer: true
  },
  // Venture Capital Funds
  {
    id: "VC-P1",
    name: "Sequoia Early Stage",
    category: "Venture Capital Funds",
    expectedReturnRange: "20.00% - 35.00%",
    minReturn: 20.0,
    maxReturn: 35.0,
    riskLevel: "Very High",
    minInvestment: 25000,
    duration: "48 Months",
    termMonths: 48,
    description: "Direct seed and Series A tech start-up investment with high risk and exceptional unicorn upside potentials.",
    featuredSection: "High Growth Opportunities",
    isTopPerformer: true
  },
  // Dividend Funds
  {
    id: "DIV-P1",
    name: "Vanguard High Dividend",
    category: "Dividend Funds",
    expectedReturnRange: "5.00% - 8.00%",
    minReturn: 5.0,
    maxReturn: 8.0,
    riskLevel: "Low",
    minInvestment: 500,
    duration: "12 Months",
    termMonths: 12,
    description: "Focuses on high-quality US corporations with long-standing histories of rising dividend distributions.",
    featuredSection: "Most Popular Investments"
  }
];

const categories = [
  "All",
  "Crypto Investments",
  "Growth Stocks",
  "Technology ETFs",
  "AI & Innovation Funds",
  "Real Estate Investments (REITs)",
  "Private Equity Funds",
  "Venture Capital Funds",
  "Dividend Funds"
];

const featuredFilters = [
  "All",
  "Trending Investments",
  "High Growth Opportunities",
  "Most Popular Investments",
  "New Investment Products",
  "Diversified Portfolios"
];

export default function InvestmentMarketplacePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and Sort states
  const [activeTab, setActiveTab] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"default" | "growth">("default");

  // Crypto portfolio for funding source
  const [cryptoPortfolio, setCryptoPortfolio] = useState<any[]>([]);

  // Modal/Invest Form states
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [principalAmount, setPrincipalAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [fundingType, setFundingType] = useState<"crypto" | "bank">("crypto");
  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [investSuccess, setInvestSuccess] = useState<string | null>(null);
  const [investError, setInvestError] = useState<string | null>(null);

  // Liquidation states
  const [isClosing, setIsClosing] = useState<string | null>(null);

  async function loadData() {
    try {
      const [userAccounts, userInvestments, portfolio] = await Promise.all([
        accountsApi.getAccounts(),
        investmentsApi.getMyInvestments(),
        cryptoApi.getPortfolio().catch(() => []),
      ]);
      setAccounts(userAccounts || []);
      setMyInvestments(userInvestments || []);
      if (userAccounts && userAccounts.length > 0) {
        setSelectedAccountId(userAccounts[0].id);
      }
      const holdings = (portfolio || []).filter((h: any) => parseFloat(h.quantity) > 0);
      setCryptoPortfolio(holdings);
      if (holdings.length > 0) {
        setSelectedCoinId(holdings[0].coinId);
        setFundingType("crypto");
      } else {
        setFundingType("bank");
      }
    } catch (err) {
      console.error("Failed to load investment page data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenInvest = (product: InvestmentProduct) => {
    setSelectedProduct(product);
    setPrincipalAmount(product.minInvestment.toString());
    setInvestSuccess(null);
    setInvestError(null);
    // Default to crypto funding if holdings exist, else bank
    if (cryptoPortfolio.length > 0) {
      setFundingType("crypto");
      setSelectedCoinId(cryptoPortfolio[0].coinId);
    } else {
      setFundingType("bank");
    }
    setModalOpen(true);
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const amt = parseFloat(principalAmount);
    if (isNaN(amt) || amt < selectedProduct.minInvestment) {
      setInvestError(`Minimum investment is $${selectedProduct.minInvestment.toLocaleString()}`);
      return;
    }

    if (fundingType === "crypto") {
      const holding = cryptoPortfolio.find(h => h.coinId === selectedCoinId);
      if (!holding) {
        setInvestError("Please select a crypto asset to fund this investment.");
        return;
      }
      const usdValue = parseFloat(holding.currentValue || "0");
      if (usdValue < amt) {
        setInvestError(`Insufficient ${holding.coinSymbol} balance. Available: ~$${usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
        return;
      }
    } else {
      const fundingAccount = accounts.find(a => a.id === selectedAccountId);
      const balance = fundingAccount ? parseFloat(fundingAccount.availableBalance) : 0;
      if (balance < amt) {
        setInvestError("Insufficient funds in the selected account.");
        return;
      }
    }

    setIsInvesting(true);
    setInvestError(null);
    setInvestSuccess(null);

    try {
      // For crypto-funded investment: sell crypto → proceeds go to primary bank account → invest
      if (fundingType === "crypto") {
        const holding = cryptoPortfolio.find(h => h.coinId === selectedCoinId);
        const primaryAccount = accounts[0];
        if (!holding || !primaryAccount) throw new Error("No valid funding source found.");

        const pricePerUnit = parseFloat(holding.currentValue) / parseFloat(holding.quantity);
        const quantityToSell = amt / pricePerUnit;

        await cryptoApi.sellCrypto({
          coinId: holding.coinId,
          coinSymbol: holding.coinSymbol,
          coinName: holding.coinName,
          quantity: quantityToSell,
          toAccountId: primaryAccount.id,
        });

        await investmentsApi.createInvestment({
          planName: selectedProduct.name,
          principalAmount: amt,
          interestRate: selectedProduct.maxReturn,
          termMonths: selectedProduct.termMonths,
          accountId: primaryAccount.id,
        });
      } else {
        await investmentsApi.createInvestment({
          planName: selectedProduct.name,
          principalAmount: amt,
          interestRate: selectedProduct.maxReturn,
          termMonths: selectedProduct.termMonths,
          accountId: selectedAccountId,
        });
      }

      setInvestSuccess(`Successfully opened "${selectedProduct.name}"!`);
      setPrincipalAmount("");
      await loadData();

      setTimeout(() => {
        setModalOpen(false);
        setInvestSuccess(null);
      }, 2000);
    } catch (err: any) {
      setInvestError(err.message || "Failed to initiate investment plan");
    } finally {
      setIsInvesting(false);
    }
  };

  const handleCloseInvestment = async (investmentId: string) => {
    if (!window.confirm("Are you sure you want to liquidate this investment portfolio? Principal and accrued interest will be paid back to your active bank account.")) {
      return;
    }

    setIsClosing(investmentId);
    try {
      await investmentsApi.closeInvestment(investmentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to liquidate investment");
    } finally {
      setIsClosing(null);
    }
  };

  // Filter and sort products according to rules
  const filteredProducts = useMemo(() => {
    let result = [...investmentProducts];

    // 1. Tab category filter
    if (activeTab !== "All") {
      result = result.filter(p => p.category === activeTab);
    }

    // 2. Featured section filter
    if (activeFilter !== "All") {
      result = result.filter(p => p.featuredSection === activeFilter);
    }

    // 3. Sorting
    if (sortBy === "growth") {
      // Sort by growth potential (max annual return)
      result.sort((a, b) => b.maxReturn - a.maxReturn);
    } else {
      // Default Sort: Category priorities (Crypto Investments first)
      const categoryPriority: Record<string, number> = {
        "Crypto Investments": 1,
        "Growth Stocks": 2,
        "Technology ETFs": 3,
        "AI & Innovation Funds": 4,
        "Real Estate Investments (REITs)": 5,
        "Private Equity Funds": 6,
        "Venture Capital Funds": 7,
        "Dividend Funds": 8
      };
      
      result.sort((a, b) => {
        const aPri = categoryPriority[a.category] || 99;
        const bPri = categoryPriority[b.category] || 99;
        if (aPri !== bPri) return aPri - bPri;
        return b.maxReturn - a.maxReturn; // Secondary sort
      });
    }

    return result;
  }, [activeTab, activeFilter, sortBy]);

  // Featured portfolios at the top
  const featuredPortfolios = useMemo(() => {
    return investmentProducts.filter(p => p.isTopPerformer).slice(0, 3);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A2342] to-brand-primary flex items-center justify-center shadow-lg animate-pulse">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Connecting to secondary market feeds...
        </div>
      </div>
    );
  }

  const totalInvested = myInvestments.filter((i: any) => i.status !== "closed").reduce((s: number, i: any) => s + parseFloat(i.principalAmount), 0);
  const totalCurrentValue = myInvestments.filter((i: any) => i.status !== "closed").reduce((s: number, i: any) => s + parseFloat(i.currentValue || i.principalAmount), 0);
  const totalGain = totalCurrentValue - totalInvested;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-[#0078B3] flex items-center justify-center shadow-lg flex-shrink-0">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-brand-secondary text-2xl">Investment</h1>
            <p className="text-gray-500 text-sm mt-0.5">Grow your wealth with diversified investment opportunities.</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 self-start md:self-auto shadow-sm">
          <Clock className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />Refresh Yields
        </button>
      </motion.div>

      {/* Portfolio summary */}
      {myInvestments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Invested", value: `$${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-brand-secondary", bg: "bg-white", border: "border-gray-100", icon: DollarSign },
            { label: "Current Value", value: `$${totalCurrentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: "text-brand-primary", bg: "bg-brand-primary/5", border: "border-brand-primary/10", icon: LineChart },
            { label: "Unrealized Gain", value: `${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, colorClass: totalGain >= 0 ? "text-emerald-600" : "text-red-500", bg: totalGain >= 0 ? "bg-emerald-50" : "bg-red-50", border: totalGain >= 0 ? "border-emerald-100" : "border-red-100", icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className={`w-3.5 h-3.5 ${s.colorClass}`} />
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
              <div className={`font-display font-bold text-xl leading-tight ${s.colorClass}`}>{s.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Featured Portfolios Carousel/Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h2 className="font-display font-bold text-brand-secondary text-sm">Featured Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredPortfolios.map((p, i) => (
            <motion.div
              key={`feat-${p.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="relative bg-gradient-to-br from-[#0A2342] to-[#1e3a8a] text-white rounded-2xl p-5 border border-white/10 overflow-hidden shadow-lg group hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="flex items-start mb-4">
                <span className="text-[10px] bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {p.category}
                </span>
              </div>
              <h3 className="font-display font-bold text-base leading-snug">{p.name}</h3>
              <p className="text-white/60 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/40 block text-[10px]">Expected APY</span>
                  <span className="text-brand-primary font-bold text-sm font-mono">{p.expectedReturnRange}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px]">Duration</span>
                  <span className="text-white font-semibold text-sm">{p.duration}</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenInvest(p)}
                className="mt-4 w-full bg-brand-primary hover:bg-brand-primary/95 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-glow"
              >
                Invest Now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Investment Portfolios */}
      {myInvestments.length > 0 && (
        <div className="dashboard-card bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-primary" />
                Active Portfolios ({myInvestments.length})
              </h2>
              <p className="text-gray-400 text-xs">Your capital currently generating interest payouts.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 font-semibold uppercase">
                  <th className="py-2.5">Portfolio Name</th>
                  <th className="py-2.5">Date Opened</th>
                  <th className="py-2.5">Maturity Date</th>
                  <th className="py-2.5">APY / Yield</th>
                  <th className="py-2.5">Initial Capital</th>
                  <th className="py-2.5">Accrued Value</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-brand-secondary font-semibold">
                {myInvestments.map((inv) => {
                  const principal = parseFloat(inv.principalAmount);
                  const current = parseFloat(inv.currentValue || inv.principalAmount);
                  const isClosed = inv.status === "closed";
                  const apy = parseFloat(inv.interestRate || "0");

                  return (
                    <tr key={inv.id} className={`hover:bg-gray-50/50 ${isClosed ? "opacity-50" : ""}`}>
                      <td className="py-3">
                        <div className="font-bold flex items-center gap-1.5">
                          {inv.planName}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            isClosed ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700 border border-green-150"
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{inv.id}</div>
                      </td>
                      <td className="py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-500">{inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString() : "Flexible"}</td>
                      <td className="py-3 text-emerald-600 font-mono">{apy > 0 ? `${apy.toFixed(2)}%` : "Market Linked"}</td>
                      <td className="py-3 font-mono">${principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 font-mono text-brand-primary font-bold">
                        ${current.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        {!isClosed ? (
                          <button
                            onClick={() => handleCloseInvestment(inv.id)}
                            disabled={isClosing === inv.id}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-100 transition-colors disabled:opacity-50"
                          >
                            {isClosing === inv.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              "Liquidate"
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400">Payout Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Catalog Section */}
      <div className="space-y-4">
        {/* Sorting & Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
          {/* Featured Filters tab row */}
          <div className="flex flex-wrap gap-1.5">
            {featuredFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFilter === f
                    ? "bg-[#0A2342] text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                }`}
              >
                {f === "All" ? "All Features" : f}
              </button>
            ))}
          </div>

          {/* Sort selection dropdown */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs text-gray-500 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="default">Default Priority</option>
              <option value="growth">Growth Potential (APY)</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-xl select-none no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === c
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p, i) => {
              const highlight = p.isTopPerformer;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className={`bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-sm hover:shadow-card-hover transition-all duration-300 relative ${
                    highlight ? "border-brand-primary/60 ring-1 ring-brand-primary/20" : "border-gray-100"
                  }`}
                >
                  {highlight && (
                    <div className="absolute -top-3 left-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      Top Performer
                    </div>
                  )}

                  {/* Header info */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">
                        {p.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-brand-secondary text-base leading-snug">{p.name}</h3>
                      <p className="text-gray-500 text-xs mt-1.5 line-clamp-3 leading-relaxed min-h-[3.5rem]">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Metric details */}
                  <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Return (APY)</span>
                        <span className="text-emerald-600 font-bold text-sm font-mono">{p.expectedReturnRange}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Duration</span>
                        <span className="text-brand-secondary font-semibold text-sm">{p.duration}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-gray-400 block text-[10px]">Min Investment</span>
                        <span className="text-brand-secondary font-bold text-sm font-mono">${p.minInvestment.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenInvest(p)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        highlight 
                          ? "bg-brand-primary hover:bg-brand-primary/95 text-white shadow-glow" 
                          : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
                      }`}
                    >
                      Invest Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm shadow-sm">
            No investment plans match the selected filters.
          </div>
        )}
      </div>

      {/* Compliance / Disclaimer / Warnings Alert */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3 text-xs text-amber-800 leading-relaxed max-w-4xl">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <strong className="text-amber-900 font-bold">Important Financial Compliance & Risk Disclosures:</strong>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-amber-800/90 font-medium">
              <li>
                <strong className="text-amber-950">Returns are NOT Guaranteed:</strong> Expected annual return rates (APY) are modeled figures based on historical performance and asset forecasts. Actual returns can fluctuate, and profits are not guaranteed.
              </li>
              <li>
                <strong className="text-amber-950">Investment Risk Warning:</strong> Investments in yield products, private equity, venture capitals, tech equities, and digital assets carry market risk. You may experience temporary or permanent loss of principal capital.
              </li>
              <li>
                <strong className="text-amber-950">No FDIC Insurance:</strong> Investment accounts are custody-managed portfolios and are not bank deposits. Unlike standard checking or savings accounts, investment products are not FDIC insured or backed by any government agency.
              </li>
              <li>
                <strong className="text-amber-950">Self-Directed Caution:</strong> Intercontinental Crest provides self-directed brokerage and custodianship. We do not offer investment advice, and client transactions are processed entirely at the account holder's direction.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Buy Investment Modal Overlay */}
      <AnimatePresence>
        {modalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative text-xs text-brand-secondary"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-display font-bold text-brand-secondary text-base mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                Initialize Investment Plan
              </h2>
              <p className="text-gray-500 text-[11px] mb-4">Fund your portfolio directly from your crypto wallet or bank account.</p>

              {/* Status Alert Banners */}
              {investSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3.5 flex items-start gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{investSuccess}</span>
                </div>
              )}
              {investError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 flex items-start gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{investError}</span>
                </div>
              )}

              {/* Product Info Summary */}
              <div className="bg-[#0A2342] text-white p-4 rounded-2xl mb-4 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">{selectedProduct.category}</div>
                <div className="font-bold text-sm text-white line-clamp-1">{selectedProduct.name}</div>
                
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-white/70 border-t border-white/10 font-mono">
                  <div>
                    <span>Est. Yield (APY)</span>
                    <strong className="block text-emerald-400 text-xs mt-0.5">{selectedProduct.expectedReturnRange}</strong>
                  </div>
                  <div>
                    <span>Term</span>
                    <strong className="block text-white text-xs mt-0.5">{selectedProduct.duration}</strong>
                  </div>
                  <div>
                    <span>Min Capital</span>
                    <strong className="block text-white text-xs mt-0.5">${selectedProduct.minInvestment.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleCreateInvestment} className="space-y-4">
                {/* Funding source — crypto or bank */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Select Funding Source</label>

                  {/* Tab toggle */}
                  <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => setFundingType("crypto")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${fundingType === "crypto" ? "bg-white text-brand-primary shadow-sm" : "text-gray-500"}`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Crypto Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setFundingType("bank")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${fundingType === "bank" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-500"}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Bank Account
                    </button>
                  </div>

                  {/* Crypto holdings list */}
                  {fundingType === "crypto" && (
                    cryptoPortfolio.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                        {cryptoPortfolio.map((h: any) => {
                          const usdVal = parseFloat(h.currentValue || "0");
                          const qty = parseFloat(h.quantity || "0");
                          const isSelected = selectedCoinId === h.coinId;
                          return (
                            <button
                              key={h.coinId}
                              type="button"
                              onClick={() => setSelectedCoinId(h.coinId)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${isSelected ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-extrabold ${isSelected ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-600"}`}>
                                {h.coinSymbol?.slice(0, 3)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-brand-secondary">{h.coinName}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{qty.toFixed(6)} {h.coinSymbol}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-bold text-emerald-600">${usdVal.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                                <div className="text-[9px] text-gray-400">≈ USD</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 text-center">
                        No crypto holdings found. Switch to Bank Account funding or buy crypto first.
                      </div>
                    )
                  )}

                  {/* Bank account native select — properly styled for mobile */}
                  {fundingType === "bank" && (
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-brand-secondary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors appearance-auto"
                    >
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName || acc.accountType?.toUpperCase() || "Account"} — ${parseFloat(acc.availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })} available
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Capital input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Investment Principal (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min={selectedProduct.minInvestment}
                      step="any"
                      required
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      placeholder={`Min. $${selectedProduct.minInvestment.toLocaleString()}`}
                      className="form-input pl-8"
                    />
                  </div>
                </div>

                {/* Compliance Warnings inside form */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 space-y-1 leading-normal">
                  <div>• Accounts are self-directed. Yield figures are not guaranteed.</div>
                  <div>• Yield-backed portfolios do not qualify for FDIC bank protections.</div>
                  <div>• Closing plans before maturity dates may forfeit yield gains.</div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={isInvesting}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInvesting}
                    className="flex-1 btn-primary justify-center text-xs py-3"
                  >
                    {isInvesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Initiating...
                      </>
                    ) : (
                      "Confirm & Open"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
