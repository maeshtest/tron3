import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: bots } = await supabase
    .from("trading_bots")
    .select("*")
    .eq("status", "running");

  if (!bots || bots.length === 0) {
    return new Response(JSON.stringify({ message: "No active bots" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cryptoIds = [...new Set(bots.map((b: any) => b.crypto_id))];
  const priceRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=usd`
  );
  const prices = await priceRes.json();

  const results = [];

  for (const bot of bots) {
    const price = prices[bot.crypto_id]?.usd;
    if (!price) continue;

    const config = bot.config as any;
    const spread = (config.spread_percent || 0.5) / 100;
    const orderSize = config.order_size || 0.1;

    let side: "buy" | "sell";
    let tradePrice: number;

    switch (bot.strategy) {
      case "trend_following":
        side = Math.random() > 0.4 ? "buy" : "sell";
        tradePrice = side === "buy"
          ? price * (1 - spread * Math.random())
          : price * (1 + spread * Math.random());
        break;
      case "arbitrage":
        side = Math.random() > 0.5 ? "buy" : "sell";
        tradePrice = price * (1 + (Math.random() - 0.5) * spread * 0.5);
        break;
      case "momentum":
        side = Math.random() > 0.3 ? "buy" : "sell";
        tradePrice = side === "buy"
          ? price * (1 - spread * 0.3)
          : price * (1 + spread * 0.3);
        break;
      default: // market_making
        side = Math.random() > 0.5 ? "buy" : "sell";
        tradePrice = side === "buy"
          ? price * (1 - spread / 2)
          : price * (1 + spread / 2);
    }

    const amount = orderSize * (0.5 + Math.random());
    const total = tradePrice * amount;
    const profit = side === "sell" ? total * spread * 0.3 : -total * spread * 0.1;

    const { error: tradeErr } = await supabase.from("bot_trades").insert({
      bot_id: bot.id,
      crypto_id: bot.crypto_id,
      side,
      price: tradePrice,
      amount,
      total,
    });

    if (!tradeErr) {
      await supabase
        .from("trading_bots")
        .update({
          total_trades: bot.total_trades + 1,
          total_profit: Number(bot.total_profit) + profit,
        })
        .eq("id", bot.id);

      results.push({ bot: bot.name, side, price: tradePrice, amount });
    }
  }

  return new Response(
    JSON.stringify({ executed: results.length, trades: results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
