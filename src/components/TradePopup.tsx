import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface TradeAlert {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  price: number;
  amount: number;
  timestamp: number;
}

let globalListeners: ((alert: TradeAlert) => void)[] = [];

export function emitTradeAlert(alert: TradeAlert) {
  globalListeners.forEach(fn => fn(alert));
}

export default function TradePopup() {
  const [alerts, setAlerts] = useState<TradeAlert[]>([]);

  useEffect(() => {
    const handler = (alert: TradeAlert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
      // Auto-remove after 4s
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 4000);
    };
    globalListeners.push(handler);
    return () => {
      globalListeners = globalListeners.filter(fn => fn !== handler);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none max-w-[280px]">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg backdrop-blur-sm pointer-events-auto ${
              alert.side === "buy"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/15 border-red-500/30 text-red-400"
            }`}
          >
            {alert.side === "buy" ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase">{alert.side} {alert.symbol}</p>
              <p className="text-[10px] opacity-80">${alert.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {alert.amount.toFixed(4)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
