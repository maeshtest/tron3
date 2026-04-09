import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public keys that non-admin users are allowed to read
const PUBLIC_KEYS = [
  "site_name",
  "support_email",
  "enabled_cryptos",
  "deposit_wallets",
  "min_deposit",
  "min_withdraw",
  "withdraw_fee_percent",
  "maintenance_mode",
  "referral_bonus_percent",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", PUBLIC_KEYS);

    if (error) throw error;

    const settings: Record<string, any> = {};
    data?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return new Response(JSON.stringify(settings), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
