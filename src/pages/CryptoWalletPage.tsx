import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useWallets } from "@/hooks/useWallets";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useTransactions } from "@/hooks/useTransactions";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";

const COIN_IMAGES: Record<string, string> = {};

const CryptoWalletPage = () => {
  const { wallets, loading } = useWallets();
  const { prices, getSymbol } = useCryptoPrices();
  const { transactions } = useTransactions();

  const recentTx = transactions.filter(t => t.type === "deposit" || t.type === "withdrawal").slice(0, 10);

  const totalValue = wallets.reduce((sum, w) => {
    const price = w.crypto_id === "usdt" ? 1 : (prices.find(p => p.id === w.crypto_id)?.current_price ?? 0);
    return sum + w.balance * price;
  }, 0);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Crypto Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your cryptocurrency holdings</p>
        </div>

        {/* Total balance */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-border rounded-2xl p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Balance</p>
          <p className="text-3xl font-display font-bold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex gap-3 mt-4">
            <Link to="/deposit"><Button variant="gold" size="sm" className="gap-2"><ArrowDown className="h-3.5 w-3.5" /> Deposit</Button></Link>
            <Link to="/withdraw"><Button variant="goldOutline" size="sm" className="gap-2"><ArrowUp className="h-3.5 w-3.5" /> Withdraw</Button></Link>
          </div>
        </div>

        {/* Holdings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Holdings</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">No assets yet</p>
              <Link to="/deposit"><Button variant="gold" size="sm" className="mt-3">Deposit Now</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map(w => {
                const coin = prices.find(p => p.id === w.crypto_id);
                const price = w.crypto_id === "usdt" ? 1 : (coin?.current_price ?? 0);
                const usdVal = w.balance * price;
                const change = coin?.price_change_percentage_24h ?? 0;
                return (
                  <div key={w.crypto_id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      {coin?.image ? (
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{w.crypto_id.slice(0, 2).toUpperCase()}</div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{getSymbol(w.crypto_id)}</p>
                        <p className="text-xs text-muted-foreground">{coin?.name || w.crypto_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{w.balance.toFixed(w.crypto_id === "usdt" ? 2 : 6)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Recent Transactions</h2>
          {recentTx.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type} — {getSymbol(tx.crypto_id)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${tx.usd_amount.toLocaleString()}</p>
                    <span className={`text-xs font-medium ${tx.status === "completed" ? "text-profit" : tx.status === "rejected" ? "text-loss" : "text-primary"}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CryptoWalletPage;
