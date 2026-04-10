import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OAuth token error:", res.status, err);
    throw new Error(`OAuth token error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

// Normalize phone to 2547XXXXXXXX format (no '+')
function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  else if (raw.startsWith("+254")) cleaned = raw.slice(1).replace(/\D/g, "");
  else if (!cleaned.startsWith("254")) throw new Error("Phone must start with 254, 0, or +254");
  if (cleaned.length !== 12 || !cleaned.startsWith("2547")) {
    throw new Error("Invalid Safaricom number. Use 2547XXXXXXXX");
  }
  return cleaned;
}

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
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
      cfg[r.key] = typeof r.value === "string" ? r.value : JSON.stringify(r.value);
    });

    const clientId = cfg.kopokopo_client_id;
    const clientSecret = cfg.kopokopo_client_secret;
    const tillNumber = cfg.kopokopo_till_number;
    const baseUrl = (cfg.kopokopo_api_base_url || "https://sandbox.kopokopo.com").replace(/\/+$/, "");
    const webhookSecret = cfg.kopokopo_webhook_secret || clientSecret;

    // ─── WEBHOOK CALLBACK ───
    if (path === "webhook") {
      const rawBody = await req.text();
      const signature = req.headers.get("X-KopoKopo-Signature") || "";

      if (webhookSecret && signature) {
        const valid = await verifySignature(rawBody, signature, webhookSecret);
        if (!valid) {
          console.error("Invalid webhook signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

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
        return new Response(JSON.stringify({ message: "Already processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
            amount: amount,
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

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── INITIATE STK PUSH ───
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!clientId || !clientSecret || !tillNumber) {
      return new Response(
        JSON.stringify({ error: "M-PESA not configured. Admin must set Kopo Kopo credentials in settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { phone_number, amount, user_id, currency = "KES", monitor_id } = body;

    if (!phone_number || !amount || !user_id) {
      return new Response(
        JSON.stringify({ error: "phone_number, amount, and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedPhone: string;
    try {
      formattedPhone = normalizePhoneNumber(phone_number);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAccessToken(clientId, clientSecret, baseUrl);
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-stk-push/webhook`;

    // Kopo Kopo v2 API payload format
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
        currency: currency,
        value: Number(amount),
      },
      metadata: {
        user_id: user_id,
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
    let stkData: any;
    try {
      stkData = JSON.parse(rawResponse);
    } catch {
      console.error("Non-JSON response from Kopo Kopo:", rawResponse.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Invalid response from payment provider", details: rawResponse.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stkRes.ok) {
      console.error("STK Push failed:", stkRes.status, stkData);
      return new Response(
        JSON.stringify({ error: "STK push failed", details: stkData }),
        { status: stkRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Kopo Kopo returns the resource location in the Location header
    const locationHeader = stkRes.headers.get("Location") || stkData?.data?.id;

    return new Response(
      JSON.stringify({
        success: true,
        message: "STK push sent. Check your phone.",
        payment_id: locationHeader,
        reference: stkData?.data?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("M-PESA error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
