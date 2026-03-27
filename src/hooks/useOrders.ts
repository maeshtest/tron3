import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Order {
  id: string;
  crypto_id: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  price: number;
  amount: number;
  filled_amount: number;
  total: number;
  status: "open" | "filled" | "cancelled";
  created_at: string;
}

export function useOrders(cryptoId?: string) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    let query = supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (cryptoId) query = query.eq("crypto_id", cryptoId);
    const { data } = await query;
    if (data) setOrders(data.map(o => ({
      ...o,
      price: Number(o.price),
      amount: Number(o.amount),
      filled_amount: Number(o.filled_amount),
      total: Number(o.total),
    })) as Order[]);
    setLoading(false);
  }, [user, cryptoId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const placeOrder = async (order: {
    crypto_id: string;
    side: "buy" | "sell";
    order_type: "market" | "limit";
    price: number;
    amount: number;
  }) => {
    if (!user) throw new Error("Not authenticated");
    const total = order.price * order.amount;

    // Insert order
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id,
      crypto_id: order.crypto_id,
      side: order.side,
      order_type: order.order_type,
      price: order.price,
      amount: order.amount,
      filled_amount: order.order_type === "market" ? order.amount : 0,
      total,
      status: order.order_type === "market" ? "filled" : "open",
    }).select().single();

    if (error) throw error;

    // For market orders, create ledger entries and update wallet balances
    if (order.order_type === "market") {
      if (order.side === "buy") {
        await supabase.from("ledger_entries" as any).insert([
          { user_id: user.id, crypto_id: "usdt", amount: -total, entry_type: "trade_buy_debit", reference_id: data.id, description: `Buy ${order.amount} ${order.crypto_id}` },
          { user_id: user.id, crypto_id: order.crypto_id, amount: order.amount, entry_type: "trade_buy_credit", reference_id: data.id, description: `Buy ${order.amount} ${order.crypto_id}` },
        ]);
        await upsertWallet(user.id, order.crypto_id, order.amount);
        await upsertWallet(user.id, "usdt", -total);
      } else {
        await supabase.from("ledger_entries" as any).insert([
          { user_id: user.id, crypto_id: order.crypto_id, amount: -order.amount, entry_type: "trade_sell_debit", reference_id: data.id, description: `Sell ${order.amount} ${order.crypto_id}` },
          { user_id: user.id, crypto_id: "usdt", amount: total, entry_type: "trade_sell_credit", reference_id: data.id, description: `Sell ${order.amount} ${order.crypto_id}` },
        ]);
        await upsertWallet(user.id, order.crypto_id, -order.amount);
        await upsertWallet(user.id, "usdt", total);
      }
    }

    await fetchOrders();
    return data;
  };

  return { orders, loading, fetchOrders, placeOrder };
}

async function upsertWallet(userId: string, cryptoId: string, amountDelta: number) {
  const { data: existing } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("crypto_id", cryptoId)
    .single();

  if (existing) {
    await supabase
      .from("wallets")
      .update({ balance: Number(existing.balance) + amountDelta })
      .eq("id", existing.id);
  } else if (amountDelta > 0) {
    await supabase
      .from("wallets")
      .insert({ user_id: userId, crypto_id: cryptoId, balance: amountDelta });
  }
}
