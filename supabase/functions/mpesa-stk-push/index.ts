import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  console.log("Requesting OAuth token from:", `${baseUrl}/oauth/token`);

  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const rawText = await res.text();
  console.log("OAuth response status:", res.status, "body length:", rawText.length);

  if (!res.ok) {
    console.error("OAuth token error:", res.status, rawText.slice(0, 500));
    throw new Error(`OAuth token error: ${res.status} - ${rawText.slice(0, 200)}`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error("OAuth returned empty response. Check client_id and client_secret.");
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`OAuth returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  if (!data.access_token) {
    throw new Error(`OAuth response missing access_token: ${JSON.stringify(data).slice(0, 200)}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  else if (raw.startsWith("+254")) cleaned = raw.slice(1).replace(/\D/g, "");
  else if (!cleaned.startsWith("254")) throw new Error("Phone must start with 254, 0, or +254");
  if (cleaned.length !== 12 || !cleaned.startsWith("254")) {
    throw new Error("Invalid phone number format. Use 2547XXXXXXXX");
  }
  return cleaned;
}

function parseSettingValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    // JSONB strings get stored as quoted strings e.g. "\"value\""
    const s = JSON.stringify(val);
    try { return JSON.parse(s); } catch { return s; }
  }
  return String(val || "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Load Kopo Kopo config from site_settings
    const { data: settingsRows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "kopokopo_client_id",
        "kopokopo_client_secret",
        "kopokopo_till_number",
        "kopokopo_api_base_url",
        "kopokopo_webhook_secret",
      ]);

    const cfg: Record<string, string> = {};
    settingsRows?.forEach((r: any) => {
      cfg[r.key] = parseSettingValue(r.value);
    });

    const clientId = cfg.kopokopo_client_id?.replace(/^"|"$/g, "");
    const clientSecret = cfg.kopokopo_client_secret?.replace(/^"|"$/g, "");
    const tillNumber = cfg.kopokopo_till_number?.replace(/^"|"$/g, "");
    const baseUrl = (cfg.kopokopo_api_base_url || "https://sandbox.kopokopo.com").replace(/^"|"$/g, "").replace(/\/+$/, "");
    const webhookSecret = (cfg.kopokopo_webhook_secret || clientSecret || "").replace(/^"|"$/g, "");

    console.log("Config loaded:", { 
      hasClientId: !!clientId, 
      hasSecret: !!clientSecret, 
      till: tillNumber, 
      baseUrl 
    });

    // ─── WEBHOOK CALLBACK ───
    if (path === "webhook") {
      const rawBody = await req.text();
      const payload = JSON.parse(rawBody);
      const eventType = payload?.topic || payload?.event?.type;
      const attributes = payload?.data?.attributes;
      const status = attributes?.status;
      const resource = attributes?.event?.resource;
      const metadata = attributes?.metadata || resource?.metadata;
      const reference = resource?.reference || payload?.data?.id;

      console.log("M-PESA webhook received:", { eventType, status, reference });

      // Idempotency check
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("tx_hash", reference)
        .maybeSingle();

      if (existing) {
        return respond(200, { message: "Already processed" });
      }

      if (status === "Success" || status === "Received") {
        const amount = Number(resource?.amount || metadata?.amount || 0);
        const userId = metadata?.user_id;
        const phone = resource?.sender_phone_number || metadata?.phone;

        if (userId && amount > 0) {
          await supabase.from("transactions").insert({
            user_id: userId,
            type: "deposit",
            crypto_id: "tether",
            amount,
            usd_amount: amount,
            status: "pending",
            wallet_address: phone || "M-PESA",
            network: "M-PESA",
            tx_hash: reference,
            notes: `M-PESA deposit from ${phone || "unknown"}`,
          });

          if (metadata?.monitor_id) {
            await supabase.from("deposit_monitors").update({
              status: "detected",
              amount_detected: amount,
              tx_hash: reference,
              updated_at: new Date().toISOString(),
            }).eq("id", metadata.monitor_id);
          }
        }
      }

      return respond(200, { received: true });
    }

    // ─── INITIATE STK PUSH ───
    if (req.method !== "POST") {
      return respond(405, { error: "Method not allowed" });
    }

    if (!clientId || !clientSecret || !tillNumber) {
      return respond(400, { 
        error: "M-PESA not configured. Admin must set Kopo Kopo credentials in settings.",
        diagnostics: { hasClientId: !!clientId, hasSecret: !!clientSecret, hasTill: !!tillNumber }
      });
    }

    const body = await req.json();
    const { phone_number, amount, user_id, currency = "KES", monitor_id } = body;

    if (!phone_number || !amount || !user_id) {
      return respond(400, { error: "phone_number, amount, and user_id are required" });
    }

    let formattedPhone: string;
    try {
      formattedPhone = normalizePhoneNumber(phone_number);
    } catch (err: any) {
      return respond(400, { error: err.message });
    }

    // Get OAuth token
    let token: string;
    try {
      token = await getAccessToken(clientId, clientSecret, baseUrl);
    } catch (err: any) {
      console.error("OAuth failed:", err.message);
      return respond(502, { 
        error: "Failed to authenticate with payment provider",
        details: err.message,
        diagnostics: { error_stage: "oauth_token" }
      });
    }

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-stk-push/webhook`;

    const stkPayload = {
      payment_channel: "M-PESA",
      till_number: tillNumber,
      subscriber: {
        first_name: "Customer",
        last_name: "",
        phone_number: `+${formattedPhone}`,
        email: null,
      },
      amount: {
        currency,
        value: Number(amount),
      },
      metadata: {
        user_id,
        phone: formattedPhone,
        amount: String(amount),
        monitor_id: monitor_id || null,
      },
      _links: {
        callback_url: callbackUrl,
      },
    };

    console.log("Initiating STK Push:", {
      phone: formattedPhone,
      amount,
      till: tillNumber,
      baseUrl,
    });

    const stkRes = await fetch(`${baseUrl}/api/v1/incoming_payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const rawResponse = await stkRes.text();
    console.log("STK Push response status:", stkRes.status, "body:", rawResponse.slice(0, 500));

    let stkData: any;
    try {
      stkData = JSON.parse(rawResponse);
    } catch {
      console.error("Non-JSON STK response:", rawResponse.slice(0, 300));
      return respond(502, { 
        error: "Invalid response from payment provider",
        details: rawResponse.slice(0, 200),
        diagnostics: { error_stage: "stk_push_parse", status: stkRes.status }
      });
    }

    if (!stkRes.ok) {
      console.error("STK Push failed:", stkRes.status, stkData);
      return respond(stkRes.status, { 
        error: "STK push failed",
        details: stkData,
        diagnostics: { error_stage: "stk_push_api" }
      });
    }

    const locationHeader = stkRes.headers.get("Location") || stkData?.data?.id;

    return respond(200, {
      success: true,
      message: "STK push sent. Check your phone.",
      payment_id: locationHeader,
      reference: stkData?.data?.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("M-PESA error:", message);
    return respond(500, { error: message });
  }
});
