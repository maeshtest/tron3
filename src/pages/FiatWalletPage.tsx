import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Banknote, Plus, ArrowUp, CreditCard, Eye, EyeOff, ChevronLeft, ChevronRight, Search, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Helper: generate or get fiat balance history from localStorage
const getFiatHistory = () => {
  const saved = localStorage.getItem("fiat_history");
  if (saved) return JSON.parse(saved);
  const today = new Date();
  const history = [];
  let value = 0;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    value = value + (Math.random() - 0.5) * 200;
    history.push({ date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.max(100, value) });
  }
  return history;
};

const FiatWalletPage = () => {
  const { wallets, loading: walletsLoading, fetchWallets } = useWallets();
  const { transactions, loading: txLoading } = useTransactions();
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fiatHistory, setFiatHistory] = useState(() => getFiatHistory());
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const itemsPerPage = 10;

  // Get USDT balance as fiat balance (USDT = 1 USD)
  const usdtWallet = wallets.find(w => w.crypto_id === "usdt" || w.crypto_id === "tether");
  const fiatBalance = usdtWallet?.balance || 0;

  // Update fiat history when balance changes
  useEffect(() => {
    const updateHistory = () => {
      const total = fiatBalance;
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      setFiatHistory(prev => {
        const last = prev[prev.length - 1];
        if (last.date === today) {
          const newData = [...prev];
          newData[newData.length - 1].value = total;
          localStorage.setItem("fiat_history", JSON.stringify(newData));
          return newData;
        }
        const newData = [...prev, { date: today, value: total }];
        if (newData.length > 30) newData.shift();
        localStorage.setItem("fiat_history", JSON.stringify(newData));
        return newData;
      });
    };
    updateHistory();
  }, [fiatBalance]);

  // Filter transactions for fiat (USDT)
  const fiatTransactions = useMemo(() => {
    return transactions
      .filter(t => (t.crypto_id === "usdt" || t.crypto_id === "tether") && (t.type === "deposit" || t.type === "withdrawal"))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions]);

  // Apply type filter
  const filteredTx = useMemo(() => {
    let tx = fiatTransactions;
    if (txFilter !== "all") tx = tx.filter(t => t.type === txFilter);
    return tx;
  }, [fiatTransactions, txFilter]);

  const paginatedTx = filteredTx.slice((txPage - 1) * itemsPerPage, txPage * itemsPerPage);
  const totalTxPages = Math.ceil(filteredTx.length / itemsPerPage);

  const displayBalance = (val: number) => balanceVisible ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "****";

  // Loading state
  const isLoading = walletsLoading || txLoading;

  // Mock payment methods (can be extended)
  const paymentMethods = [
    { id: "1", name: "Visa •••• 4242", type: "card", isDefault: true },
    { id: "2", name: "M-Pesa +254 712 345 678", type: "mobile" },
    { id: "3", name: "Bank Transfer (Chase)", type: "bank" },
  ];

  // Summary stats
  const totalDeposits = fiatTransactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.usd_amount, 0);
  const totalWithdrawals = fiatTransactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((s, t) => s + t.usd_amount, 0);
  const pendingCount = fiatTransactions.filter(t => t.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Fiat Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your USD balance and payment methods</p>
        </div>

        {/* Balance Card with Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Fiat Balance (USD)</p>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-muted-foreground hover:text-foreground p-1">
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">
            {displayBalance(fiatBalance)}
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/deposit">
              <Button variant="gold" size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Deposit
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button variant="goldOutline" size="sm" className="gap-2">
                <ArrowUp className="h-3.5 w-3.5" /> Withdraw
              </Button>
            </Link>
          </div>

          {/* Balance History Chart */}
          <div className="h-32 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fiatHistory}>
                <defs>
                  <linearGradient id="fiatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#fiatGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Deposits</p>
            <p className="text-xl font-bold text-profit">${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Withdrawals</p>
            <p className="text-xl font-bold text-loss">${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Pending Transactions</p>
            <p className="text-xl font-bold text-primary">{pendingCount}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Payment Methods</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              <Plus className="h-3.5 w-3.5" /> Add New
            </Button>
          </div>
          <div className="space-y-2">
            {paymentMethods.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{m.name}</span>
                {m.isDefault && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Default</span>
                )}
                <span className="text-xs text-muted-foreground ml-auto capitalize">{m.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Fiat Transactions</h2>
            <div className="flex gap-2">
              {(["all", "deposit", "withdrawal"] as const).map(t => (
                <Button
                  key={t}
                  variant={txFilter === t ? "gold" : "ghost"}
                  size="sm"
                  onClick={() => { setTxFilter(t); setTxPage(1); }}
                  className="text-xs capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : paginatedTx.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">${tx.usd_amount.toLocaleString()}</p>
                      <span className={`text-xs font-medium ${tx.status === "completed" ? "text-profit" : tx.status === "rejected" ? "text-loss" : "text-primary"}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {totalTxPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {txPage} of {totalTxPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                    disabled={txPage === totalTxPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FiatWalletPage;
