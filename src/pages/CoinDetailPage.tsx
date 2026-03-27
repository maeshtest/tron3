import { useParams, Link } from "react-router-dom";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAppStore } from "@/stores/useAppStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, BarChart3, DollarSign, Clock, Globe, Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TIMEFRAMES = [
  { label: "1D", value: "1" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "All" },
];

const CoinDetailPage = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const { prices, getSymbol } = useCryptoPrices(15000);
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState("1");
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const coin = prices.find((p) => p.id === coinId);
  const symbol = coinId ? getSymbol(coinId) : "";

  // TradingView Widget with timeframe control
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) return;
    chartContainerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}USDT`,
      interval: timeframe,
      timezone: "Etc/UTC",
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      support_host: "https://www.tradingview.com",
    });
    chartContainerRef.current.appendChild(script);
  }, [symbol, timeframe]);

  if (!coin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 container text-center">
          <p className="text-muted-foreground">Loading coin data...</p>
        </main>
      </div>
    );
  }

  const priceChangeClass = coin.price_change_percentage_24h >= 0 ? "text-profit" : "text-loss";
  const priceChangeBg = coin.price_change_percentage_24h >= 0 ? "bg-profit/10" : "bg-loss/10";

  // Helper to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 container">
        {/* Back link & watchlist button */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Markets
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWatchlisted(!isWatchlisted)}
            className="gap-1.5 text-muted-foreground hover:text-primary"
          >
            {isWatchlisted ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            {isWatchlisted ? "Watchlisted" : "Add to Watchlist"}
          </Button>
        </div>

        {/* Header with coin image, name, price, and change */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <img src={coin.image} alt={coin.name} className="w-12 h-12 rounded-full" />
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {coin.name} <span className="text-muted-foreground text-lg">({symbol})</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-bold text-foreground">
                {sym}{coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${priceChangeBg} ${priceChangeClass}`}>
                {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - expanded */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: DollarSign, label: "Market Cap", value: `${sym}${(coin.market_cap / 1e9).toFixed(2)}B`, tooltip: "Total market capitalization" },
            { icon: BarChart3, label: "24h Volume", value: `${sym}${(coin.total_volume / 1e9).toFixed(2)}B`, tooltip: "Trading volume in the last 24 hours" },
            { icon: TrendingUp, label: "24h High", value: `${sym}${coin.high_24h?.toLocaleString() || "N/A"}`, tooltip: "Highest price in the last 24 hours" },
            { icon: TrendingUp, label: "24h Low", value: `${sym}${coin.low_24h?.toLocaleString() || "N/A"}`, tooltip: "Lowest price in the last 24 hours" },
            { icon: Clock, label: "ATH", value: `${sym}${coin.ath?.toLocaleString() || "N/A"}`, tooltip: "All-time high" },
            { icon: Clock, label: "ATL", value: `${sym}${coin.atl?.toLocaleString() || "N/A"}`, tooltip: "All-time low" },
            { icon: Globe, label: "Total Supply", value: formatNumber(coin.total_supply || 0), tooltip: "Total coins that will ever exist" },
            { icon: Globe, label: "Circulating Supply", value: formatNumber(coin.circulating_supply || 0), tooltip: "Coins currently in circulation" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground group-hover:text-primary/80 transition-colors">
                  {stat.label}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground" title={stat.tooltip}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Chart Section with Timeframe Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
          <div className="flex flex-wrap items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{symbol}/USDT Chart</h2>
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-2 py-1 text-xs rounded-md transition-all ${
                    timeframe === tf.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          <div ref={chartContainerRef} className="h-[500px] w-full" />
        </div>

        {/* Quick Trade Panel & Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Trade Card */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Trade
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link to={`/spot-trading?coin=${coinId}&side=buy`}>
                <Button variant="cta" size="lg" className="w-full gap-2">
                  Buy {symbol}
                </Button>
              </Link>
              <Link to={`/spot-trading?coin=${coinId}&side=sell`}>
                <Button variant="destructive" size="lg" className="w-full gap-2">
                  Sell {symbol}
                </Button>
              </Link>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <p>Trade {symbol} on the spot market with low fees. Click above to open the full trading interface.</p>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">About {coin.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {coin.description?.slice(0, 200) || "No description available."}
            </p>
            <div className="border-t border-border pt-3 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rank</span>
                <span className="text-foreground font-medium">#{coin.market_cap_rank || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Website</span>
                {coin.links?.homepage?.[0] ? (
                  <a href={coin.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {new URL(coin.links.homepage[0]).hostname}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoinDetailPage;
