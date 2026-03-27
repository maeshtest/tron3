import DashboardLayout from "@/components/DashboardLayout";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAppStore } from "@/stores/useAppStore";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const MarketsPage = () => {
  const { prices, loading, getSymbol } = useCryptoPrices(15000);
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Markets</h1>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">24h %</th>
                <th className="text-right py-3 px-4 hidden sm:table-cell">Market Cap</th>
                <th className="text-right py-3 px-4 hidden sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 px-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                : prices.map((coin, idx) => (
                    <tr key={coin.id} className="border-b border-border/50 hover:bg-surface transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <Link to={`/coin/${coin.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                          <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                          <span className="font-medium text-foreground">{coin.name}</span>
                          <span className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">{sym}{coin.current_price.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? "text-profit" : "text-loss"}`}>
                        {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell">{sym}{(coin.market_cap / 1e9).toFixed(2)}B</td>
                      <td className="py-3 px-4 text-right text-muted-foreground hidden sm:table-cell">{sym}{(coin.total_volume / 1e9).toFixed(2)}B</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketsPage;
