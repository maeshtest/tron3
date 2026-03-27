import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Wallet {
  id: string;
  crypto_id: string;
  balance: number;
}

export function useWallets() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id);
    if (data) setWallets(data.map(w => ({ ...w, balance: Number(w.balance) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const getBalance = (cryptoId: string) =>
    wallets.find(w => w.crypto_id === cryptoId)?.balance ?? 0;

  const getTotalUsdValue = (prices: { id: string; current_price: number }[]) =>
    wallets.reduce((total, w) => {
      const price = w.crypto_id === "usdt" ? 1 : (prices.find(p => p.id === w.crypto_id)?.current_price ?? 0);
      return total + w.balance * price;
    }, 0);

  return { wallets, loading, fetchWallets, getBalance, getTotalUsdValue };
}
