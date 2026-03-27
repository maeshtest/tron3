import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminTransactions() {
  return useQuery({
    queryKey: ["admin_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        amount: Number(t.amount),
        usd_amount: Number(t.usd_amount),
      }));
    },
    refetchInterval: 10000,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminWallets() {
  return useQuery({
    queryKey: ["admin_wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((w: any) => ({ ...w, balance: Number(w.balance) }));
    },
  });
}

export function useAdminBots() {
  return useQuery({
    queryKey: ["admin_bots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_bots")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((b: any) => ({
        ...b,
        total_profit: Number(b.total_profit),
      }));
    },
  });
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txId, action }: { txId: string; action: "completed" | "rejected" }) => {
      // Get transaction details first
      const { data: tx, error: fetchErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", txId)
        .single();
      if (fetchErr || !tx) throw new Error("Transaction not found");

      // Update transaction status
      const { error: updateErr } = await supabase
        .from("transactions")
        .update({ status: action })
        .eq("id", txId);
      if (updateErr) throw updateErr;

      // If approving a deposit, create ledger entry and credit the wallet
      if (action === "completed" && tx.type === "deposit") {
        await supabase.from("ledger_entries" as any).insert({
          user_id: tx.user_id,
          crypto_id: tx.crypto_id,
          amount: Number(tx.amount),
          entry_type: "deposit",
          reference_id: tx.id,
          description: `Deposit ${Number(tx.amount)} ${tx.crypto_id}`,
        });

        const { data: existing } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", tx.user_id)
          .eq("crypto_id", tx.crypto_id)
          .single();

        if (existing) {
          await supabase
            .from("wallets")
            .update({ balance: Number(existing.balance) + Number(tx.amount) })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("wallets")
            .insert({ user_id: tx.user_id, crypto_id: tx.crypto_id, balance: Number(tx.amount) });
        }
      }

      // If approving a withdrawal, create ledger entry and debit the wallet
      if (action === "completed" && tx.type === "withdrawal") {
        await supabase.from("ledger_entries" as any).insert({
          user_id: tx.user_id,
          crypto_id: tx.crypto_id,
          amount: -Number(tx.amount),
          entry_type: "withdrawal",
          reference_id: tx.id,
          description: `Withdrawal ${Number(tx.amount)} ${tx.crypto_id}`,
        });

        const { data: existing } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", tx.user_id)
          .eq("crypto_id", tx.crypto_id)
          .single();

        if (existing) {
          await supabase
            .from("wallets")
            .update({ balance: Math.max(0, Number(existing.balance) - Number(tx.amount)) })
            .eq("id", existing.id);
        }
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin_wallets"] });
      toast.success(`Transaction ${action === "completed" ? "approved" : "rejected"} successfully`);
    },
    onError: (err: any) => {
      toast.error("Failed: " + err.message);
    },
  });
}

export function useManageBot() {
  const queryClient = useQueryClient();

  const createBot = useMutation({
    mutationFn: async (bot: { name: string; crypto_id: string; strategy: string; config: any }) => {
      const cfg = bot.config || {};
      const { error } = await supabase.from("trading_bots").insert({
        name: bot.name,
        crypto_id: bot.crypto_id,
        strategy: bot.strategy,
        config: { spread_percent: cfg.spread_percent || 0.5, order_size: cfg.order_size || 0.1, max_orders: cfg.max_orders || 5 },
        tier: cfg.tier || "free",
        description: cfg.description || "",
        is_ai: cfg.is_ai || false,
        min_stake: cfg.min_stake || 30,
        daily_earn: cfg.daily_earn || 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bots"] });
      toast.success("Bot created");
    },
  });

  const updateBot = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("trading_bots").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bots"] });
      toast.success("Bot updated");
    },
  });

  const deleteBot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trading_bots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bots"] });
      toast.success("Bot deleted");
    },
  });

  return { createBot, updateBot, deleteBot };
}

export function useAdminAddBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cryptoId, amount }: { userId: string; cryptoId: string; amount: number }) => {
      const { data: existing } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("crypto_id", cryptoId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("wallets")
          .update({ balance: Number(existing.balance) + amount })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wallets")
          .insert({ user_id: userId, crypto_id: cryptoId, balance: amount });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_wallets"] });
      toast.success("Balance updated");
    },
  });
}
