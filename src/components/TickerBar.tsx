import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAppStore } from "@/stores/useAppStore";

const TickerBar = () => {
  const { prices, loading, getSymbol } = useCryptoPrices(30000);
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  const tickers = loading || prices.length === 0
    ? [
        { symbol: "BTC/USDT", price: `${sym}--`, change: "--", up: true },
        { symbol: "ETH/USDT", price: `${sym}--`, change: "--", up: true },
        { symbol: "SOL/USDT", price: `${sym}--`, change: "--", up: true },
      ]
    : prices.map((p) => ({
        symbol: `${getSymbol(p.id)}/USDT`,
        price: `${sym}${p.current_price.toLocaleString()}`,
        change: `${p.price_change_percentage_24h >= 0 ? "+" : ""}${p.price_change_percentage_24h.toFixed(2)}%`,
        up: p.price_change_percentage_24h >= 0,
      }));

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-card border-b border-border overflow-hidden h-8">
      <div className="animate-ticker-scroll flex items-center h-full whitespace-nowrap">
        {[...tickers, ...tickers].map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-4 text-xs">
            <span className="font-medium text-foreground">{t.symbol}</span>
            <span className="text-muted-foreground">{t.price}</span>
            <span className={t.up ? "text-profit" : "text-loss"}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
