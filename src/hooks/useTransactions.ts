import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  crypto_id: string;
  amount: number;
  usd_amount: number;
  wallet_address: string | null;
  status: "pending" | "completed" | "rejected";
  created_at: string;
  user_id: string;
  network?: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data.map(t => ({
      ...t,
      amount: Number(t.amount),
      usd_amount: Number(t.usd_amount),
    })) as Transaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const createTransaction = async (tx: {
    type: "deposit" | "withdrawal";
    crypto_id: string;
    amount: number;
    usd_amount: number;
    wallet_address?: string;
    network?: string;
  }) => {
    const { network, ...insertData } = tx;
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      ...insertData,
    });
    if (error) throw error;
    await fetchTransactions();
  };

  return { transactions, loading, fetchTransactions, createTransaction };
}
