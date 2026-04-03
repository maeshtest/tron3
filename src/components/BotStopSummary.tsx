import { X, TrendingUp, Clock, Coins, Award, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BotStopSummaryProps {
  botName: string;
  pair: string;
  strategy: string;
  stakedAmount: number;
  profit: number;
  duration: string;
  totalTrades: number;
  winRate: number;
  onClose: () => void;
}

export default function BotStopSummary({
  botName, pair, strategy, stakedAmount, profit, duration, totalTrades, winRate, onClose
}: BotStopSummaryProps) {
  const totalReturn = stakedAmount + profit;
  const profitRate = stakedAmount > 0 ? (profit / stakedAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className={`p-6 text-center relative ${profit >= 0 ? "bg-gradient-to-b from-emerald-500/20 to-transparent" : "bg-gradient-to-b from-destructive/20 to-transparent"}`}>
          <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${profit >= 0 ? "bg-emerald-500/20" : "bg-destructive/20"}`}>
            <Award className={`h-7 w-7 ${profit >= 0 ? "text-emerald-400" : "text-destructive"}`} />
          </div>
          <h2 className="text-lg font-bold text-foreground">{botName}</h2>
          <p className="text-xs text-muted-foreground mt-1">{strategy} · {pair}</p>
        </div>

        {/* Profit Rate */}
        <div className="text-center py-4 border-b border-border">
          <p className={`text-4xl font-bold tabular-nums ${profit >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {profit >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Profit Rate</p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-2.5">
          {[
            { label: "Pair", value: pair, icon: <Target className="h-3.5 w-3.5" /> },
            { label: "Investment", value: `$${stakedAmount.toFixed(2)} USDT`, icon: <Coins className="h-3.5 w-3.5" /> },
            { label: "Profit Earned", value: `${profit >= 0 ? "+$" : "-$"}${Math.abs(profit).toFixed(2)} USDT`, color: profit >= 0 ? "text-emerald-400" : "text-destructive" },
            { label: "Total Return", value: `$${totalReturn.toFixed(2)} USDT`, color: "text-foreground font-bold" },
            { label: "Duration", value: duration, icon: <Clock className="h-3.5 w-3.5" /> },
            { label: "Total Trades", value: totalTrades.toLocaleString(), icon: <BarChart3 className="h-3.5 w-3.5" /> },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: <TrendingUp className="h-3.5 w-3.5" /> },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">{row.icon}{row.label}</span>
              <span className={row.color || "text-foreground"}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={onClose}>Done</Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2">Funds returned to your USDT wallet</p>
        </div>
      </div>
    </div>
  );
}
