import { ArrowLeft, Power, Settings, ChevronDown, RefreshCw, TrendingUp, TrendingDown, Zap, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TRADEABLE = [
  "bitcoin", "ethereum", "solana", "binancecoin", "ripple",
  "cardano", "polkadot", "dogecoin", "avalanche-2", "chainlink",
  "litecoin", "tron", "stellar"
] as const;

interface BotAnalyticsProps {
  bot: any;
  onBack: () => void;
  onUnstake?: (bot: any) => void;
  unstaking?: boolean;
}

function formatDuration(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function generateSignalCode(botId: string) {
  return `BOT-${botId.substring(0, 2).toUpperCase()}-${botId.substring(2, 10).toUpperCase()}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export default function BotAnalyticsView({ bot, onBack, onUnstake, unstaking }: BotAnalyticsProps) {
  const { getSymbol, prices } = useCryptoPrices();
  const [activeTab, setActiveTab] = useState<"running" | "analytics" | "settings">("running");
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [botPhase, setBotPhase] = useState<"buying" | "selling">("buying");

  const stakedAmount = Number(bot.config?.staked_amount || 0);
  const profit = Number(bot.total_profit || 0);
  const pair = `${getSymbol(bot.crypto_id)}/USDT`;
  const stratLabel = bot.strategy === "market_making" ? "Grid" : bot.strategy;
  const returnAmount = stakedAmount + profit;
  const signalCode = generateSignalCode(bot.id);

  // Timer that counts up from bot start, resets every ~60s cycle (fast)
  useEffect(() => {
    const interval = setInterval(() => {
      const totalSec = Math.floor((Date.now() - new Date(bot.created_at).getTime()) / 1000);
      const cycleSec = totalSec % 60;
      setElapsed(cycleSec);
      setBotPhase(cycleSec < 30 ? "buying" : "selling");
    }, 1000);
    return () => clearInterval(interval);
  }, [bot.created_at]);

  const timerDisplay = `${Math.floor((60 - (elapsed % 60)) / 60)}:${String((60 - (elapsed % 60)) % 60).padStart(2, "0")}`;
  const progressPercent = ((elapsed % 60) / 60) * 100;

  const filteredPairs = useMemo(() => {
    const q = pairSearch.toLowerCase();
    return TRADEABLE.filter(id => {
      const p = prices.find(pr => pr.id === id);
      if (!p) return false;
      return p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q);
    });
  }, [pairSearch, prices]);

  // Fetch trade history
  const { data: trades = [] } = useQuery({
    queryKey: ["bot_analytics_trades", bot.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bot_trades")
        .select("*")
        .eq("bot_id", bot.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    refetchInterval: 2000,
  });

  // Stats
  const totalTrades = bot.total_trades || 0;
  const winRate = trades.length > 0
    ? ((trades.filter((t: any) => Number(t.pnl || 0) > 0).length / trades.length) * 100)
    : 0;

  // PNL chart data from trades
  const pnlChartData = useMemo(() => {
    if (!trades.length) return [];
    const sorted = [...trades].reverse();
    let cumPnl = 0;
    return sorted.map((t: any, i: number) => {
      cumPnl += Number(t.pnl || 0);
      return { idx: i + 1, pnl: parseFloat(cumPnl.toFixed(2)) };
    });
  }, [trades]);

  const handleSwitchPair = async (newCryptoId: string) => {
    await supabase
      .from("trading_bots")
      .update({ crypto_id: newCryptoId })
      .eq("id", bot.id);
    setPairDropdownOpen(false);
    setPairSearch("");
  };

  // Auto-stop info
  const autoStop = bot.config?.autoStop;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border bg-card shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{bot.name}</h2>
              <p className="text-xs text-muted-foreground">{pair} · {stratLabel}</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shrink-0">
            LIVE
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card shrink-0">
        {(["running", "analytics", "settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "running" && <><Activity className="h-3.5 w-3.5 inline mr-1" />Live</>}
            {tab === "analytics" && <><BarChart3 className="h-3.5 w-3.5 inline mr-1" />Analytics</>}
            {tab === "settings" && <><Settings className="h-3.5 w-3.5 inline mr-1" />Settings</>}
          </button>
        ))}
      </div>

      {activeTab === "running" && (
        <div className="flex-1 overflow-y-auto">
          {/* Execution Status Card */}
          <div className="mx-3 mt-3 bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Bot executing trades...</span>
              <span className="text-sm font-bold text-primary tabular-nums">{timerDisplay}</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Staked</p>
                <p className="text-sm font-bold text-foreground">${stakedAmount.toFixed(2)}</p>
              </div>
              <div className="bg-secondary/50 border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Win Rate</p>
                <p className="text-sm font-bold text-foreground">{winRate.toFixed(1)}%</p>
              </div>
              <div className="bg-secondary/50 border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Profit</p>
                <p className={`text-sm font-bold ${profit > 0 ? "text-emerald-400" : profit < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {profit > 0 ? `+$${profit.toFixed(2)}` : profit < 0 ? `-$${Math.abs(profit).toFixed(2)}` : "Pending..."}
                </p>
              </div>
            </div>

            {/* Signal Code */}
            <div className="mt-2 bg-secondary/50 border border-border rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Signal Code</p>
                <p className="text-xs font-bold text-primary font-mono">{signalCode}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Duration</p>
                <p className="text-xs font-medium text-foreground">{formatDuration(bot.created_at)}</p>
              </div>
            </div>

            {/* Auto-stop info */}
            {autoStop?.enabled && (
              <div className="mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Auto-Stop Active
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {autoStop.profitTarget && <span className="text-[10px] text-muted-foreground">TP: {autoStop.profitTarget}%</span>}
                  {autoStop.lossLimit && <span className="text-[10px] text-muted-foreground">SL: {autoStop.lossLimit}%</span>}
                  {autoStop.timeLimitMinutes && <span className="text-[10px] text-muted-foreground">Time: {autoStop.timeLimitMinutes}m</span>}
                </div>
              </div>
            )}
          </div>

          {/* Phase Banner */}
          <div className={`mx-3 mt-2 px-3 py-2.5 rounded-xl border flex items-center gap-2 ${
            botPhase === "buying"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-destructive/10 border-destructive/30"
          }`}>
            {botPhase === "buying" ? (
              <>
                <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">ACCUMULATING — BUYING</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs font-bold text-destructive uppercase tracking-wide">DISTRIBUTING — SELLING</span>
              </>
            )}
          </div>

          {/* Live Trade Feed */}
          <div className="mx-3 mt-2 mb-3 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <h3 className="text-xs font-bold text-foreground">Live Trades</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
              </div>
            </div>
            {trades.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-xs">
                Waiting for first trade...
              </div>
            ) : (
              <div className="divide-y divide-border/30 max-h-[240px] overflow-y-auto">
                {trades.slice(0, 20).map((t: any) => {
                  const sym = getSymbol(t.crypto_id);
                  return (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {t.side === "buy" ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold w-12">
                            <TrendingUp className="h-3 w-3" /> BUY
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive font-bold w-12">
                            <TrendingDown className="h-3 w-3" /> SELL
                          </span>
                        )}
                        <span className="text-foreground tabular-nums font-medium">
                          ${Number(t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`tabular-nums font-medium ${(t.pnl || 0) > 0 ? "text-emerald-400" : "text-destructive"}`}>
                          +${Number(t.pnl || 0).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground tabular-nums w-8 text-right">
                          {timeAgo(t.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Cumulative PNL Chart */}
          <div className="bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> Cumulative PNL
            </h3>
            {pnlChartData.length > 1 ? (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pnlChartData}>
                    <XAxis dataKey="idx" hide />
                    <YAxis width={40} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(val: number) => [`$${val.toFixed(2)}`, "PNL"]}
                    />
                    <Line type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">Collecting data...</p>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Trades", value: totalTrades.toLocaleString() },
              { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
              { label: "Total Profit", value: `$${profit.toFixed(2)}`, color: profit >= 0 ? "text-emerald-400" : "text-destructive" },
              { label: "ROI", value: `${stakedAmount > 0 ? ((profit / stakedAmount) * 100).toFixed(2) : 0}%`, color: profit >= 0 ? "text-emerald-400" : "text-destructive" },
            ].map(m => (
              <div key={m.label} className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className={`text-sm font-bold ${m.color || "text-foreground"}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Trades Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-xs font-bold text-foreground">Trade History</h3>
            </div>
            <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left px-3 py-2">Side</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Amount</th>
                    <th className="text-right px-3 py-2">PNL</th>
                    <th className="text-right px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 20).map((t: any) => (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className={`px-3 py-1.5 font-bold ${t.side === "buy" ? "text-emerald-400" : "text-destructive"}`}>
                        {t.side.toUpperCase()}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">${Number(t.price).toLocaleString()}</td>
                      <td className="text-right px-3 py-1.5 tabular-nums">{Number(t.amount).toFixed(4)}</td>
                      <td className={`text-right px-3 py-1.5 tabular-nums font-medium ${(t.pnl || 0) >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                        +${Number(t.pnl || 0).toFixed(2)}
                      </td>
                      <td className="text-right px-3 py-1.5 text-muted-foreground">{timeAgo(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Switch Pair */}
          <div className="bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-primary" /> Switch Trading Pair
            </h3>
            <p className="text-[11px] text-muted-foreground mb-2">Current: <span className="text-foreground font-medium">{pair}</span></p>
            <div className="relative">
              <button
                onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground hover:border-primary/30 transition-colors"
              >
                <span>{pair}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${pairDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {pairDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2">
                    <input
                      type="text"
                      value={pairSearch}
                      onChange={e => setPairSearch(e.target.value)}
                      placeholder="Search pairs..."
                      className="w-full h-8 rounded-lg bg-secondary border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredPairs.map(id => {
                      const p = prices.find(pr => pr.id === id);
                      if (!p) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => handleSwitchPair(id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/80 transition-colors ${
                            bot.crypto_id === id ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={p.image} alt="" className="w-5 h-5 rounded-full" />
                            <span className="font-medium text-foreground">{getSymbol(id)}/USDT</span>
                          </div>
                          <span className="text-foreground">${p.current_price.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bot Parameters */}
          <div className="bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-primary" /> Bot Parameters
            </h3>
            <div className="divide-y divide-border">
              {[
                { label: "Strategy", value: bot.strategy === "market_making" ? "Spot Grid" : bot.strategy },
                { label: "Spread", value: `${(bot.config?.spread_percent || 0.5)}%` },
                { label: "Order Size", value: `${(bot.config?.order_size || 0.1)}` },
                { label: "Max Orders", value: `${(bot.config?.max_orders || 5)}` },
                { label: "Staked Amount", value: `$${stakedAmount.toFixed(2)} USDT` },
                { label: "Duration", value: formatDuration(bot.created_at) },
                { label: "Total Trades", value: totalTrades.toLocaleString() },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-xs font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal Summary */}
          <div className="bg-card border border-border rounded-xl p-3">
            <h3 className="text-xs font-semibold text-foreground mb-2">Withdrawal Summary</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Staked</span>
                <span className="text-foreground">${stakedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Profit/Loss</span>
                <span className={profit >= 0 ? "text-emerald-400" : "text-destructive"}>{profit >= 0 ? "+" : ""}${profit.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-foreground">Total Return</span>
                <span className={returnAmount >= stakedAmount ? "text-emerald-400" : "text-destructive"}>${returnAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        {onUnstake && (
          <Button
            className="w-full h-11 text-sm font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg"
            onClick={() => onUnstake(bot)}
            disabled={unstaking}
          >
            <Power className="h-4 w-4 mr-2" />
            {unstaking ? "Stopping..." : `Stop Bot & Withdraw $${returnAmount.toFixed(2)}`}
          </Button>
        )}
      </div>
    </div>
  );
}
