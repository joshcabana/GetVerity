import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ORIGINS = [
  "https://getverity.com.au",
  "https://spark-echo-verity.lovable.app",
  "https://id-preview--a81e90ba-a208-41e2-bf07-a3adfb94bfcb.lovable.app",
];

// Allowlisted price IDs → mode mapping
const PRICE_MAP: Record<string, { mode: "payment" | "subscription" }> = {
  "price_starter_10": { mode: "payment" },
  "price_popular_15": { mode: "payment" },
  "price_value_30": { mode: "payment" },
  "price_pass_monthly": { mode: "subscription" },
  "price_pass_annual": { mode: "subscription" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.json();

    // Validate price_id against allowlist
    const price_id = typeof body.price_id === "string" ? body.price_id.trim() : "";
    const priceConfig = PRICE_MAP[price_id];
    if (!priceConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid price" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build URLs server-side from allowlisted origins
    const origin = req.headers.get("origin") || "";
    const safeOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const success_url = `${safeOrigin}/tokens?success=true`;
    const cancel_url = `${safeOrigin}/tokens`;

    // Use existing stripe_customer_id or create a new Stripe customer
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: paymentInfo } = await supabaseAdmin
      .from("user_payment_info")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = paymentInfo?.stripe_customer_id;

    if (!customerId) {
      // Check if a Stripe customer with this email already exists
      const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({ email: user.email });
        customerId = newCustomer.id;
      }

      // Cache stripe_customer_id for future lookups
      await supabaseAdmin
        .from("user_payment_info")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: priceConfig.mode,
      success_url,
      cancel_url,
      customer: customerId,
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-checkout error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
