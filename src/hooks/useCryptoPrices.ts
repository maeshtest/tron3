import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
  high_24h?: number;
  low_24h?: number;
  ath?: number;
  atl?: number;
  total_supply?: number;
  circulating_supply?: number;
  market_cap_rank?: number;
  description?: string;
  links?: { homepage?: string[] };
  [key: string]: any;
}

const COIN_IDS = [
  "bitcoin", "ethereum", "tether", "binancecoin", "ripple",
  "cardano", "polkadot", "dogecoin", "avalanche-2", "chainlink",
  "solana", "litecoin", "tron", "stellar"
];

const SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", tether: "USDT", solana: "SOL", binancecoin: "BNB",
  ripple: "XRP", cardano: "ADA", polkadot: "DOT", dogecoin: "DOGE",
  "avalanche-2": "AVAX", chainlink: "LINK",
  litecoin: "LTC", tron: "TRX", stellar: "XLM",
};

export function useCryptoPrices(refreshInterval = 30000) {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currency = useAppStore((s) => s.currency);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${COIN_IDS.join(",")}&order=market_cap_desc&sparkline=false`
      );
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      setPrices(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  const getSymbol = (id: string) => SYMBOL_MAP[id] || id.toUpperCase();

  return { prices, loading, error, refetch: fetchPrices, getSymbol, currency };
}
