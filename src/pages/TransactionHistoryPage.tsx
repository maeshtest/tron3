import DashboardLayout from "@/components/DashboardLayout";
import { useTransactions } from "@/hooks/useTransactions";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAppStore } from "@/stores/useAppStore";
import { useState, useMemo } from "react";
import { Search, Filter, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar, RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TransactionHistoryPage = () => {
  const { transactions, loading } = useTransactions();
  const { getSymbol } = useCryptoPrices();
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  // Filter states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort transactions
  const filtered = useMemo(() => {
    let result = [...transactions];

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(t => t.type === typeFilter);
    }
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }
    // Search (coin, ID, address, amount)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.crypto_id.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.wallet_address && t.wallet_address.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q) ||
        t.usd_amount.toString().includes(q)
      );
    }
    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(t => new Date(t.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(t => new Date(t.created_at) <= to);
    }
    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
      } else {
        const aAmt = a.usd_amount;
        const bAmt = b.usd_amount;
        return sortOrder === "desc" ? bAmt - aAmt : aAmt - bAmt;
      }
    });
    return result;
  }, [transactions, typeFilter, statusFilter, search, dateFrom, dateTo, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Monthly chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      months.push({ month: monthStr, deposits: 0, withdrawals: 0, net: 0 });
    }
    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const monthStr = txDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const monthData = months.find(m => m.month === monthStr);
      if (monthData) {
        if (tx.type === "deposit" && tx.status === "completed") {
          monthData.deposits += tx.usd_amount;
        } else if (tx.type === "withdrawal" && tx.status === "completed") {
          monthData.withdrawals += tx.usd_amount;
        }
      }
    });
    months.forEach(m => m.net = m.deposits - m.withdrawals);
    return months;
  }, [transactions]);

  // Summary stats
  const totalDeposits = transactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.usd_amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((s, t) => s + t.usd_amount, 0);
  const pendingCount = transactions.filter(t => t.status === "pending").length;

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-profit" />;
    if (status === "rejected") return <XCircle className="h-4 w-4 text-loss" />;
    return <Clock className="h-4 w-4 text-primary animate-pulse" />;
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground">View and manage all your deposits and withdrawals</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Deposits</p>
            <p className="text-xl font-display font-bold text-profit">{sym}{totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Withdrawals</p>
            <p className="text-xl font-display font-bold text-loss">{sym}{totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-xl font-display font-bold text-primary">{pendingCount}</p>
          </div>
        </div>

        {/* Monthly Chart */}
        {monthlyData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Monthly Activity (USD)
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withdrawalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="deposits" stroke="hsl(var(--profit))" fill="url(#depositGradient)" name="Deposits" />
                  <Area type="monotone" dataKey="withdrawals" stroke="hsl(var(--loss))" fill="url(#withdrawalGradient)" name="Withdrawals" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search coin, ID, address..."
                className="w-full h-10 rounded-lg bg-secondary border border-border pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Type filter */}
            <div className="flex gap-2">
              {(["all", "deposit", "withdrawal"] as const).map(t => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "gold" : "goldOutline"}
                  size="sm"
                  onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                  className="capitalize flex-1"
                >
                  {t}
                </Button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              {(["all", "pending", "completed", "rejected"] as const).map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "gold" : "goldOutline"}
                  size="sm"
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className="capitalize text-xs flex-1"
                >
                  {s}
                </Button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-lg bg-secondary border border-border pl-7 pr-2 text-xs text-foreground"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 rounded-lg bg-secondary border border-border pl-7 pr-2 text-xs text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <Button
              variant={sortBy === "date" ? "gold" : "ghost"}
              size="sm"
              onClick={() => { setSortBy("date"); setSortOrder(prev => prev === "desc" ? "asc" : "desc"); }}
              className="text-xs"
            >
              Date {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
            </Button>
            <Button
              variant={sortBy === "amount" ? "gold" : "ghost"}
              size="sm"
              onClick={() => { setSortBy("amount"); setSortOrder(prev => prev === "desc" ? "asc" : "desc"); }}
              className="text-xs"
            >
              Amount {sortBy === "amount" && (sortOrder === "desc" ? "↓" : "↑")}
            </Button>
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions match your filters</p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-3">Clear Filters</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedTransactions.map(tx => (
                <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className={`p-2 rounded-lg ${tx.type === "deposit" ? "bg-profit/10" : "bg-loss/10"}`}>
                    {tx.type === "deposit"
                      ? <ArrowDownCircle className="h-5 w-5 text-profit" />
                      : <ArrowUpCircle className="h-5 w-5 text-loss" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground capitalize">{tx.type}</p>
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{getSymbol(tx.crypto_id)}</span>
                      {tx.network && <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{tx.network}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(tx.created_at).toLocaleString()}
                      {tx.wallet_address && ` • ${tx.wallet_address.slice(0, 12)}...`}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{sym}{tx.usd_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{tx.amount.toFixed(6)} {getSymbol(tx.crypto_id)}</p>
                    </div>
                    {statusIcon(tx.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistoryPage;
