import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { ArrowRightLeft, Search, ChevronDown, Clock, X, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

const ConverterPage = () => {
  const { prices, getSymbol, loading: pricesLoading } = useCryptoPrices();
  const currency = useAppStore((s) => s.currency);
  const sym = currency === "inr" ? "₹" : "$";

  // Use "tether" for USDT (API uses "tether")
  const [fromCoin, setFromCoin] = useState("bitcoin");
  const [toCoin, setToCoin] = useState("tether");
  const [amount, setAmount] = useState("1");
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [recentConversions, setRecentConversions] = useState<any[]>([]);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Load recent conversions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent_conversions");
    if (saved) setRecentConversions(JSON.parse(saved));
  }, []);

  // Save conversion to localStorage when a conversion is performed
  const saveConversion = (fromId: string, toId: string, fromAmount: number, toAmount: number) => {
    const fromSym = getSymbol(fromId);
    const toSym = getSymbol(toId);
    const newEntry = {
      id: Date.now(),
      from: fromId,
      to: toId,
      fromAmount,
      toAmount,
      fromSymbol: fromSym,
      toSymbol: toSym,
      timestamp: new Date().toISOString(),
    };
    setRecentConversions(prev => {
      const updated = [newEntry, ...prev].slice(0, 5);
      localStorage.setItem("recent_conversions", JSON.stringify(updated));
      return updated;
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) setFromDropdownOpen(false);
      if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) setToDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Helper to get price (USDT = 1)
  const getPrice = (coinId: string) => {
    if (coinId === "tether") return 1;
    const coin = prices.find(p => p.id === coinId);
    return coin?.current_price || 0;
  };

  const fromPrice = getPrice(fromCoin);
  const toPrice = getPrice(toCoin);
  const fromAmount = parseFloat(amount) || 0;
  const convertedAmount = toPrice > 0 ? (fromAmount * fromPrice) / toPrice : 0;
  const usdValueFrom = fromAmount * fromPrice;
  const usdValueTo = convertedAmount * toPrice;

  // Swap coins and update amount to match converted value
  const swap = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
    setAmount(convertedAmount.toString());
  };

  // Perform conversion (save to history)
  const handleConvert = () => {
    if (fromAmount <= 0) return;
    saveConversion(fromCoin, toCoin, fromAmount, convertedAmount);
  };

  // Filtered coin lists for dropdowns (exclude the opposite coin)
  const filteredFromCoins = useMemo(() => {
    let coins = prices.filter(c => c.id !== toCoin);
    if (fromSearch) {
      coins = coins.filter(c => 
        c.name.toLowerCase().includes(fromSearch.toLowerCase()) || 
        getSymbol(c.id).toLowerCase().includes(fromSearch.toLowerCase())
      );
    }
    return coins.slice(0, 30);
  }, [prices, fromSearch, toCoin]);

  const filteredToCoins = useMemo(() => {
    let coins = prices.filter(c => c.id !== fromCoin);
    if (toSearch) {
      coins = coins.filter(c => 
        c.name.toLowerCase().includes(toSearch.toLowerCase()) || 
        getSymbol(c.id).toLowerCase().includes(toSearch.toLowerCase())
      );
    }
    return coins.slice(0, 30);
  }, [prices, toSearch, fromCoin]);

  if (pricesLoading && prices.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const fromCoinData = prices.find(p => p.id === fromCoin);
  const toCoinData = prices.find(p => p.id === toCoin);
  const fromSymbol = fromCoin === "tether" ? "USDT" : getSymbol(fromCoin);
  const toSymbol = toCoin === "tether" ? "USDT" : getSymbol(toCoin);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">Currency Converter</h1>
          <p className="text-sm text-muted-foreground">Convert between crypto and fiat with real rates</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* From */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <div className="flex gap-2">
              {/* Coin dropdown */}
              <div className="relative" ref={fromDropdownRef}>
                <button
                  onClick={() => setFromDropdownOpen(!fromDropdownOpen)}
                  className="h-11 min-w-[120px] rounded-lg bg-secondary border border-border px-3 flex items-center justify-between gap-2 text-sm text-foreground"
                >
                  <div className="flex items-center gap-2">
                    {fromCoinData?.image && <img src={fromCoinData.image} alt={fromSymbol} className="w-5 h-5 rounded-full" />}
                    <span>{fromSymbol}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {fromDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={fromSearch}
                          onChange={e => setFromSearch(e.target.value)}
                          placeholder="Search coins..."
                          className="w-full pl-7 pr-2 h-7 rounded bg-secondary text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredFromCoins.map(coin => (
                        <button
                          key={coin.id}
                          onClick={() => {
                            setFromCoin(coin.id);
                            setFromDropdownOpen(false);
                            setFromSearch("");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors"
                        >
                          <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full" />
                          <span className="font-medium text-foreground">{coin.id === "tether" ? "USDT" : getSymbol(coin.id)}</span>
                          <span className="text-muted-foreground ml-auto">${coin.current_price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 h-11 rounded-lg bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary"
                min="0"
                step="any"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {sym}{(usdValueFrom).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={swap}
              className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>

          {/* To */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <div className="flex gap-2">
              <div className="relative" ref={toDropdownRef}>
                <button
                  onClick={() => setToDropdownOpen(!toDropdownOpen)}
                  className="h-11 min-w-[120px] rounded-lg bg-secondary border border-border px-3 flex items-center justify-between gap-2 text-sm text-foreground"
                >
                  <div className="flex items-center gap-2">
                    {toCoinData?.image && <img src={toCoinData.image} alt={toSymbol} className="w-5 h-5 rounded-full" />}
                    <span>{toSymbol}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {toDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={toSearch}
                          onChange={e => setToSearch(e.target.value)}
                          placeholder="Search coins..."
                          className="w-full pl-7 pr-2 h-7 rounded bg-secondary text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredToCoins.map(coin => (
                        <button
                          key={coin.id}
                          onClick={() => {
                            setToCoin(coin.id);
                            setToDropdownOpen(false);
                            setToSearch("");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors"
                        >
                          <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full" />
                          <span className="font-medium text-foreground">{coin.id === "tether" ? "USDT" : getSymbol(coin.id)}</span>
                          <span className="text-muted-foreground ml-auto">${coin.current_price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 h-11 rounded-lg bg-secondary/50 border border-border px-4 flex items-center text-sm font-bold text-foreground tabular-nums">
                {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {sym}{(usdValueTo).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Button variant="gold" className="w-full h-11" onClick={handleConvert}>
            Convert
          </Button>
        </div>

        {/* Recent Conversions */}
        {recentConversions.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Conversions
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRecentConversions([]);
                  localStorage.removeItem("recent_conversions");
                }}
                className="h-7 text-xs gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            </div>
            <div className="space-y-2">
              {recentConversions.map(conv => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setFromCoin(conv.from);
                    setToCoin(conv.to);
                    setAmount(conv.fromAmount.toString());
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {conv.fromAmount.toFixed(conv.fromSymbol === "USDT" ? 2 : 6)} {conv.fromSymbol} → {conv.toAmount.toFixed(conv.toSymbol === "USDT" ? 2 : 6)} {conv.toSymbol}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(conv.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConverterPage;
