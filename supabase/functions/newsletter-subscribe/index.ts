import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Resend API key
    const { data: settingRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "resend_api_key")
      .single();

    let resendKey = settingRow?.value;
    if (typeof resendKey === "string") {
      resendKey = resendKey.replace(/^"|"$/g, "");
    }

    if (!resendKey || typeof resendKey !== "string" || resendKey.length < 5) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send welcome/confirmation email
    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#ffffff;">
        <h1 style="font-size:24px;font-weight:700;color:#0a0e17;text-align:center;">Welcome to Tronnlix! 🎉</h1>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Thanks for subscribing to the Tronnlix newsletter.</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;">You'll receive updates on new features, market insights, and platform announcements.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://tronnlix.com" style="background:#d4a017;color:#0a0e17;padding:14px 32px;border-radius:12px;font-weight:bold;text-decoration:none;display:inline-block;">Visit Tronnlix</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Tronnlix. All rights reserved.</p>
      </div>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Tronnlix <support@tronnlix.com>",
        to: [email],
        subject: "Welcome to the Tronnlix Newsletter!",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Newsletter error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
