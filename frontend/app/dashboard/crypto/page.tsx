"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  DollarSign, Wallet, RefreshCw, Star, Info, ChevronRight,
  CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2, ArrowRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { cryptoApi, accountsApi } from "@/lib/api";

export default function CryptoMarketplacePage() {
  // Live market and portfolio state
  const [markets, setMarkets] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<{ holdings: any[]; orders: any[] }>({ holdings: [], orders: [] });
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Loading and refreshing states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Chart and detail coin state
  const [selectedCoinId, setSelectedCoinId] = useState("bitcoin");
  const [selectedCoinDetail, setSelectedCoinDetail] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartDays, setChartDays] = useState(7);
  const [loadingChart, setLoadingChart] = useState(false);

  // Trade form state
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [selectedTradeCoin, setSelectedTradeCoin] = useState<any>(null);
  const [usdAmount, setUsdAmount] = useState<string>("");
  const [coinQuantity, setCoinQuantity] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");

  // Load initial data — markets load first so the page is never blank
  useEffect(() => {
    async function initData() {
      try {
        const marketList = await cryptoApi.getMarkets();
        setMarkets(marketList);

        if (marketList && marketList.length > 0) {
          const defaultCoin = marketList.find((c: any) => c.id === "bitcoin") || marketList[0];
          setSelectedTradeCoin(defaultCoin);
          setSelectedCoinId(defaultCoin.id);
        }
      } catch (err) {
        console.error("Failed to load market data", err);
      } finally {
        setLoading(false);
      }

      // Load user portfolio and accounts separately — failure here won't blank markets
      try {
        const [portfolioData, userAccounts] = await Promise.all([
          cryptoApi.getPortfolio(),
          accountsApi.getAccounts(),
        ]);
        setPortfolio(portfolioData);
        setAccounts(userAccounts);
        if (userAccounts && userAccounts.length > 0) {
          setSelectedAccountId(userAccounts[0].id);
        }
      } catch (err) {
        console.error("Failed to load portfolio/accounts", err);
      }
    }
    initData();
  }, []);

  // Fetch live market prices periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const marketList = await cryptoApi.getMarkets();
        setMarkets(marketList);
      } catch (err) {
        console.error("Failed to refresh markets in background", err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load coin details and chart data whenever coinId or chartDays changes
  useEffect(() => {
    if (!selectedCoinId) return;

    async function loadChartAndDetails() {
      setLoadingChart(true);
      try {
        const [detail, chart] = await Promise.all([
          cryptoApi.getCoinDetail(selectedCoinId),
          cryptoApi.getHistoricalChart(selectedCoinId, chartDays)
        ]);

        setSelectedCoinDetail(detail);

        // Format historical chart data for Recharts
        if (chart && chart.prices) {
          const formatted = chart.prices.map(([timestamp, price]: [number, number]) => {
            const date = new Date(timestamp);
            return {
              name: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              price: price != null ? parseFloat(price.toFixed(2)) : 0
            };
          });
          setChartData(formatted);
        }
      } catch (err) {
        console.error(`Failed to load details for ${selectedCoinId}`, err);
      } finally {
        setLoadingChart(false);
      }
    }
    loadChartAndDetails();
  }, [selectedCoinId, chartDays]);

  // Sync trade coin selection when clicking from market list
  const handleSelectCoin = (coin: any) => {
    setSelectedCoinId(coin.id);
    setSelectedTradeCoin(coin);
    setTradeSuccess(null);
    setTradeError(null);
  };

  // Manual refresh button action
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const marketList = await cryptoApi.getMarkets();
      setMarkets(marketList);
      setTradeSuccess("Market prices updated!");
      setTimeout(() => setTradeSuccess(null), 3000);
    } catch {
      setTradeError("Failed to refresh market data");
      setTimeout(() => setTradeError(null), 3000);
    } finally {
      setRefreshing(false);
    }
    try {
      const [portfolioData, userAccounts] = await Promise.all([
        cryptoApi.getPortfolio(),
        accountsApi.getAccounts(),
      ]);
      setPortfolio(portfolioData);
      setAccounts(userAccounts);
    } catch {
      // Portfolio refresh failure is non-fatal; markets are already updated
    }
  };

  // Calculate user total portfolio value
  const portfolioStats = useMemo(() => {
    if (!portfolio.holdings || markets.length === 0) {
      return { totalValue: 0, totalProfitLoss: 0, totalProfitLossPercentage: 0 };
    }

    let totalValue = 0;
    let totalCost = 0;

    portfolio.holdings.forEach((holding: any) => {
      const liveCoin = markets.find((m: any) => m.id === holding.coinId);
      const currentPrice = (liveCoin && liveCoin.current_price != null) ? liveCoin.current_price : parseFloat(holding.avgBuyPrice);
      const qty = parseFloat(holding.quantity);
      const avgPrice = parseFloat(holding.avgBuyPrice);

      totalValue += qty * currentPrice;
      totalCost += qty * avgPrice;
    });

    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalProfitLoss,
      totalProfitLossPercentage
    };
  }, [portfolio.holdings, markets]);

  // Execute buy or sell order
  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeCoin || !selectedAccountId) return;

    setIsTrading(true);
    setTradeSuccess(null);
    setTradeError(null);

    try {
      if (tradeType === "buy") {
        const val = parseFloat(usdAmount);
        if (isNaN(val) || val <= 0) {
          throw new Error("Enter a valid purchase amount");
        }

        const res = await cryptoApi.buyCrypto({
          coinId: selectedTradeCoin.id,
          coinSymbol: selectedTradeCoin.symbol,
          coinName: selectedTradeCoin.name,
          usdAmount: val,
          fromAccountId: selectedAccountId
        });

        setTradeSuccess(res.message || "Crypto purchased successfully!");
        setUsdAmount("");
      } else {
        const qty = parseFloat(coinQuantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error("Enter a valid sale quantity");
        }

        const res = await cryptoApi.sellCrypto({
          coinId: selectedTradeCoin.id,
          coinSymbol: selectedTradeCoin.symbol,
          coinName: selectedTradeCoin.name,
          quantity: qty,
          toAccountId: selectedAccountId
        });

        setTradeSuccess(res.message || "Crypto sold successfully!");
        setCoinQuantity("");
      }

      // Refresh portfolio, balance accounts
      const [portfolioData, userAccounts] = await Promise.all([
        cryptoApi.getPortfolio(),
        accountsApi.getAccounts()
      ]);
      setPortfolio(portfolioData);
      setAccounts(userAccounts);
    } catch (err: any) {
      setTradeError(err.message || "Trade execution failed");
    } finally {
      setIsTrading(false);
    }
  };

  // Find user holding for selected trade coin
  const activeTradeCoinHolding = useMemo(() => {
    if (!selectedTradeCoin || !portfolio.holdings) return 0;
    const h = portfolio.holdings.find((holding: any) => holding.coinId === selectedTradeCoin.id);
    return h ? parseFloat(h.quantity) : 0;
  }, [selectedTradeCoin, portfolio.holdings]);

  // Find chosen bank account balance
  const activeBankAccountBalance = useMemo(() => {
    if (!selectedAccountId || !accounts) return 0;
    const acc = accounts.find((a: any) => a.id === selectedAccountId);
    return acc ? parseFloat(acc.availableBalance) : 0;
  }, [selectedAccountId, accounts]);

  // Crypto wallets: real holdings if any, else placeholder wallets with zero balance
  const cryptoWallets = useMemo(() => {
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      return portfolio.holdings.map((h: any) => {
        const coin = markets.find((m: any) => m.id === h.coinId);
        const price = (coin && coin.current_price != null) ? coin.current_price : parseFloat(h.avgBuyPrice);
        const qty = parseFloat(h.quantity);
        return {
          id: h.coinId,
          symbol: (h.coinSymbol || "").toUpperCase(),
          name: h.coinName || h.coinSymbol,
          quantity: qty,
          valueUsd: qty * price,
          image: coin?.image,
        };
      });
    }
    return [
      { id: "btc-wallet",  symbol: "BTC",  name: "Bitcoin",  quantity: 0, valueUsd: 0, image: undefined },
      { id: "eth-wallet",  symbol: "ETH",  name: "Ethereum", quantity: 0, valueUsd: 0, image: undefined },
      { id: "sol-wallet",  symbol: "SOL",  name: "Solana",   quantity: 0, valueUsd: 0, image: undefined },
      { id: "usdt-wallet", symbol: "USDT", name: "Tether",   quantity: 0, valueUsd: 0, image: undefined },
    ];
  }, [portfolio.holdings, markets]);

  // Auto-select first wallet when list changes (e.g., after holdings load)
  useEffect(() => {
    if (cryptoWallets.length > 0) {
      const exists = cryptoWallets.some((w) => w.id === selectedWalletId);
      if (!exists) setSelectedWalletId(cryptoWallets[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoWallets]);

  const selectedWallet = cryptoWallets.find((w) => w.id === selectedWalletId) ?? cryptoWallets[0] ?? null;

  // Estimate trade Net and Fee values
  const tradeEstimates = useMemo(() => {
    if (!selectedTradeCoin) return { subtotal: 0, fee: 0, total: 0 };
    
    if (tradeType === "buy") {
      const val = parseFloat(usdAmount) || 0;
      const fee = val * 0.005; // 0.5%
      const net = val - fee;
      const coins = (val > 0 && selectedTradeCoin?.current_price) ? net / selectedTradeCoin.current_price : 0;
      return {
        subtotal: val,
        fee,
        total: net,
        coinsEst: coins
      };
    } else {
      const qty = parseFloat(coinQuantity) || 0;
      const gross = qty * (selectedTradeCoin?.current_price || 0);
      const fee = gross * 0.005;
      const net = gross - fee;
      return {
        subtotal: gross,
        fee,
        total: net,
        coinsEst: qty
      };
    }
  }, [tradeType, selectedTradeCoin, usdAmount, coinQuantity]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading market indices and portfolio stats...</p>
      </div>
    );
  }

  // Find currently selected coin details from market list
  const currentCoinMarket = markets.find((c: any) => c.id === selectedCoinId) || markets[0];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl flex items-center gap-2">
            <Coins className="w-6 h-6 text-brand-primary" />
            Digital Asset Marketplace
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time cryptocurrency trade desk funded by your banking deposits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Markets
          </button>
        </div>
      </div>

      {/* Portfolio overview blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-secondary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Asset Holding Value</p>
          <h2 className="text-3xl font-display font-bold mt-2">
            ${portfolioStats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-brand-primary" />
            </div>
            <span className="text-white/80">Stored in secure custodial vaults</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Unrealized Growth (Net)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className={`text-3xl font-display font-bold ${portfolioStats.totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {portfolioStats.totalProfitLoss >= 0 ? "+" : ""}
              ${portfolioStats.totalProfitLoss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`text-sm font-bold flex items-center gap-0.5 ${portfolioStats.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
              {portfolioStats.totalProfitLoss >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
              {portfolioStats.totalProfitLossPercentage.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-3">Calculated relative to weighted buy history</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Trading Account balance</p>
            <h2 className="text-3xl font-display font-bold mt-2 text-brand-secondary">
              ${(selectedWallet?.valueUsd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h2>
            {selectedWallet && selectedWallet.quantity > 0 && (
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {selectedWallet.quantity.toFixed(6)} {selectedWallet.symbol}
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-gray-50 pt-2.5">
            <span className="text-gray-400">Crypto Wallet</span>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1 font-semibold text-xs outline-none focus:border-brand-primary"
            >
              {cryptoWallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.symbol}){w.quantity > 0 ? ` — ${w.quantity.toFixed(4)} ${w.symbol}` : " — $0.00"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Trade Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Coin List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[640px]">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-display font-bold text-brand-secondary text-sm">Supported Cryptocurrencies</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any asset to analyze or set up trades.</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {markets.map((coin: any) => {
              const selected = coin.id === selectedCoinId;
              const isUp = coin.price_change_percentage_24h >= 0;
              return (
                <button
                  key={coin.id}
                  onClick={() => handleSelectCoin(coin)}
                  className={`w-full text-left p-3.5 flex items-center justify-between transition-all outline-none ${
                    selected ? "bg-brand-primary/5 border-l-4 border-brand-primary" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-bold text-sm text-brand-secondary flex items-center gap-1.5">
                        {coin.name}
                        <span className="text-[10px] text-gray-400 font-mono font-normal uppercase">{coin.symbol}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Vol: ${coin.total_volume != null ? (coin.total_volume / 1e6).toFixed(1) + "M" : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-brand-secondary">
                      ${coin.current_price != null
                        ? coin.current_price >= 1
                          ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2 })
                          : coin.current_price.toFixed(4)
                        : "0.00"}
                    </div>
                    <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${isUp ? "text-green-500" : "text-red-500"}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) + "%" : "0.00%"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Chart & Analytics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6 lg:col-span-2 flex flex-col justify-between h-[640px]">
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              {currentCoinMarket && (
                <>
                  <img src={currentCoinMarket.image} alt={currentCoinMarket.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <h3 className="font-display font-bold text-brand-secondary text-base flex items-baseline gap-1.5">
                      {currentCoinMarket.name}
                      <span className="text-xs text-gray-400 font-mono font-normal uppercase">({currentCoinMarket.symbol}/USD)</span>
                    </h3>
                    <p className="text-gray-500 text-xs font-semibold font-mono flex items-center gap-1.5 mt-0.5">
                      ${currentCoinMarket?.current_price != null ? currentCoinMarket.current_price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                      <span className={currentCoinMarket?.price_change_percentage_24h != null ? (currentCoinMarket.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500") : "text-gray-400"}>
                        ({currentCoinMarket?.price_change_percentage_24h != null ? (currentCoinMarket.price_change_percentage_24h >= 0 ? "+" : "") + currentCoinMarket.price_change_percentage_24h.toFixed(2) : "0.00"}%)
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Timeframe selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl self-start">
              {[
                { label: "24 Hours", value: 1 },
                { label: "7 Days", value: 7 },
                { label: "30 Days", value: 30 }
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setChartDays(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    chartDays === t.value ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400 hover:text-brand-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display */}
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            {loadingChart ? (
              <div className="flex flex-col items-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary mb-2" />
                <span className="text-xs">Fetching indices...</span>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toLocaleString("en-US")}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0A2342", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [`$${val.toLocaleString()}`, "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#00B7F1"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#00B7F1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-400">Historical data temporarily unavailable</span>
            )}
          </div>

          {/* Sparkline Analytics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100 text-center text-xs">
            <div>
              <div className="text-gray-400">24h High</div>
              <div className="font-mono font-bold text-brand-secondary mt-1">
                ${currentCoinMarket?.high_24h ? currentCoinMarket.high_24h.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-400">24h Low</div>
              <div className="font-mono font-bold text-brand-secondary mt-1">
                ${currentCoinMarket?.low_24h ? currentCoinMarket.low_24h.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Market Rank</div>
              <div className="font-bold text-brand-secondary mt-1">
                #{currentCoinMarket?.market_cap_rank || "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Circulating Supply</div>
              <div className="font-mono font-bold text-brand-secondary mt-1">
                {currentCoinMarket?.circulating_supply ? (currentCoinMarket.circulating_supply / 1e6).toFixed(1) + "M" : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade execution form & holdings grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy/Sell Order Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-brand-secondary text-sm">Create Trade Order</h3>
            <p className="text-xs text-gray-400 mt-0.5">Fund instant trades using your local balance.</p>
          </div>

          {/* Notification status banners */}
          {tradeSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{tradeSuccess}</span>
            </div>
          )}
          {tradeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{tradeError}</span>
            </div>
          )}

          {/* Trade Type Toggles */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setTradeType("buy");
                setTradeSuccess(null);
                setTradeError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tradeType === "buy" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400 hover:text-brand-secondary"
              }`}
            >
              BUY ASSETS
            </button>
            <button
              onClick={() => {
                setTradeType("sell");
                setTradeSuccess(null);
                setTradeError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tradeType === "sell" ? "bg-white text-brand-secondary shadow-sm" : "text-gray-400 hover:text-brand-secondary"
              }`}
            >
              SELL ASSETS
            </button>
          </div>

          {/* Trade Form */}
          <form onSubmit={handleExecuteTrade} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Asset Selected</label>
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <img src={selectedTradeCoin?.image} alt="" className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-sm text-brand-secondary">{selectedTradeCoin?.name}</span>
                </div>
                <span className="text-xs text-gray-500 font-bold uppercase">{selectedTradeCoin?.symbol}</span>
              </div>
            </div>

            {tradeType === "buy" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Purchase Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="Min. $1.00"
                    className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold outline-none focus:border-brand-primary"
                    required
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                  <span>Available bank balance: ${activeBankAccountBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <button type="button" onClick={() => setUsdAmount(activeBankAccountBalance.toFixed(2))} className="text-brand-primary font-bold hover:underline">
                    Use Max
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sale Quantity ({selectedTradeCoin?.symbol})</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.00000001"
                    value={coinQuantity}
                    onChange={(e) => setCoinQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand-primary"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">
                    {selectedTradeCoin?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                  <span>Available holdings: {activeTradeCoinHolding.toFixed(6)} {selectedTradeCoin?.symbol}</span>
                  <button type="button" onClick={() => setCoinQuantity(activeTradeCoinHolding.toString())} className="text-brand-primary font-bold hover:underline">
                    Use Max
                  </button>
                </div>
              </div>
            )}

            {/* Estimates panel */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-mono text-gray-700 font-bold">${tradeEstimates.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Trading Fee (0.5%)</span>
                <span className="font-mono text-gray-700 font-bold">${tradeEstimates.fee.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200/60 pt-2 font-semibold text-brand-secondary">
                <span>{tradeType === "buy" ? "Net Purchased" : "Proceeds Credited"}</span>
                <span className="font-mono font-bold text-brand-primary">
                  {tradeType === "buy" 
                    ? `${tradeEstimates.coinsEst?.toFixed(6) || 0} ${selectedTradeCoin?.symbol}` 
                    : `$${tradeEstimates.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isTrading}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-glow transition-all flex items-center justify-center gap-2 ${
                tradeType === "buy" 
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-800/50" 
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-800/50"
              }`}
            >
              {isTrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Executing Order...
                </>
              ) : (
                <>
                  {tradeType === "buy" ? "Confirm Purchase" : "Confirm Sale"}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Portfolio Holdings list (Middle/Right panel) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-brand-secondary text-sm">Your Holdings</h3>
                <p className="text-xs text-gray-400 mt-0.5">Asset storage and growth valuation breakdown.</p>
              </div>
              <span className="text-xs bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full font-bold">
                {portfolio.holdings?.length || 0} Assets
              </span>
            </div>

            {portfolio.holdings && portfolio.holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase font-semibold">
                      <th className="py-2.5">Asset</th>
                      <th className="py-2.5">Qty Owned</th>
                      <th className="py-2.5">Avg Buy Price</th>
                      <th className="py-2.5">Current Price</th>
                      <th className="py-2.5 text-right">Holding Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-brand-secondary">
                    {portfolio.holdings.map((h: any) => {
                      const coin = markets.find((m: any) => m.id === h.coinId);
                      const qty = parseFloat(h.quantity);
                      const avg = parseFloat(h.avgBuyPrice);
                      const current = (coin && coin.current_price != null) ? coin.current_price : avg;
                      const value = qty * current;
                      
                      return (
                        <tr key={h.id} className="hover:bg-gray-50/50">
                          <td className="py-3 flex items-center gap-2">
                            {coin ? (
                              <img src={coin.image} className="w-6 h-6 rounded-full" alt="" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-primary uppercase">{h.coinSymbol.slice(0, 2)}</div>
                            )}
                            <div>
                              <div className="font-bold">{h.coinName}</div>
                              <div className="text-[10px] text-gray-400 uppercase font-mono">{h.coinSymbol}</div>
                            </div>
                          </td>
                          <td className="py-3 font-mono">{qty.toFixed(6)}</td>
                          <td className="py-3 font-mono">${avg.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 font-mono">${current.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 font-mono text-right font-bold text-brand-primary">${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                You do not hold any digital assets. Use the trade console to get started.
              </div>
            )}
          </div>

          {/* Historical Orders section */}
          <div className="mt-6 border-t border-gray-100 pt-5 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Orders Log</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {portfolio.orders && portfolio.orders.length > 0 ? (
                portfolio.orders.slice(0, 4).map((o: any) => {
                  const isBuy = o.type === "buy";
                  const date = new Date(o.createdAt);
                  return (
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isBuy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {isBuy ? "B" : "S"}
                        </span>
                        <div>
                          <div className="font-bold text-brand-secondary">
                            {isBuy ? "Bought" : "Sold"} {parseFloat(o.quantity).toFixed(6)} {o.coinSymbol}
                          </div>
                          <div className="text-[10px] text-gray-400">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-brand-secondary">${parseFloat(o.totalUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-gray-400">Price: ${parseFloat(o.priceAtTime).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-[10px] text-gray-400">No order logs found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
