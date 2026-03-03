import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Price ID → entitlement map (must match create-checkout PRICE_MAP)
const PRICE_ENTITLEMENTS: Record<string, { tokens?: number; tier?: string; annual?: boolean }> = {
  "price_starter_10": { tokens: 10 },
  "price_popular_15": { tokens: 15 },
  "price_value_30": { tokens: 30 },
  "price_pass_monthly": { tier: "pass_monthly", annual: false },
  "price_pass_annual": { tier: "pass_annual", annual: true },
};

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Idempotency check
  const { error: idempotencyErr } = await supabase
    .from("stripe_processed_events")
    .insert({ event_id: event.id });

  if (idempotencyErr) {
    if (idempotencyErr.code === "23505") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Idempotency insert error:", idempotencyErr);
  }

  // Helper: find profile by stripe_customer_id, fallback to email lookup with proper filter
  async function findProfileByCustomer(customerId: string) {
    // Try stripe_customer_id first via user_payment_info
    const { data: paymentInfo } = await supabase
      .from("user_payment_info")
      .select("user_id, stripe_customer_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (paymentInfo) {
      // Fetch profile data needed for entitlements
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, token_balance")
        .eq("user_id", paymentInfo.user_id)
        .single();
      return profile ? { ...profile, stripe_customer_id: paymentInfo.stripe_customer_id } : null;
    }

    // Fallback: get customer email from Stripe, then find user by email
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || !("email" in customer) || !customer.email) return null;

      // Efficient O(1) lookup: use Supabase admin getUserByEmail (GoTrue filter)
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserByEmail(customer.email);
      if (userErr || !userData?.user) return null;

      const userId = userData.user.id;

      const { data: fallbackProfile } = await supabase
        .from("profiles")
        .select("user_id, token_balance")
        .eq("user_id", userId)
        .single();

      // Cache stripe_customer_id in user_payment_info for future lookups
      if (fallbackProfile) {
        await supabase
          .from("user_payment_info")
          .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: "user_id" });
      }

      return fallbackProfile ? { ...fallbackProfile, stripe_customer_id: customerId } : null;
    } catch (err) {
      console.error("Customer lookup fallback error:", err);
      return null;
    }
  }

  async function clearSubscription(customerId: string) {
    const profile = await findProfileByCustomer(customerId);
    if (!profile) return;
    await supabase
      .from("profiles")
      .update({ subscription_tier: "free", subscription_expires_at: null })
      .eq("user_id", profile.user_id);
  }

  async function syncSubscription(customerId: string, sub: Stripe.Subscription) {
    const profile = await findProfileByCustomer(customerId);
    if (!profile) return;

    const canceledStatuses: Stripe.Subscription.Status[] = [
      "canceled",
      "incomplete_expired",
      "unpaid",
    ];
    if (canceledStatuses.includes(sub.status)) {
      await clearSubscription(customerId);
      return;
    }

    const subscriptionPriceId = sub.items.data[0]?.price?.id;
    const entitlement = subscriptionPriceId ? PRICE_ENTITLEMENTS[subscriptionPriceId] : null;
    if (!entitlement?.tier) {
      // Unknown subscription product: fail safe to free tier.
      await clearSubscription(customerId);
      return;
    }

    const expiresAt = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    await supabase
      .from("profiles")
      .update({
        subscription_tier: entitlement.tier,
        subscription_expires_at: expiresAt,
      })
      .eq("user_id", profile.user_id);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!customerId) break;

        const profile = await findProfileByCustomer(customerId);
        if (!profile) break;

        // Determine entitlement from line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        const entitlement = priceId ? PRICE_ENTITLEMENTS[priceId] : null;

        if (entitlement?.tokens) {
          await supabase
            .from("profiles")
            .update({ token_balance: (profile.token_balance || 0) + entitlement.tokens })
            .eq("user_id", profile.user_id);

          await supabase.from("token_transactions").insert({
            user_id: profile.user_id,
            amount: entitlement.tokens,
            reason: `Purchased ${entitlement.tokens} token pack`,
            stripe_session_id: session.id,
          });
        } else if (entitlement?.tier) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + (entitlement.annual ? 12 : 1));

          await supabase
            .from("profiles")
            .update({
              subscription_tier: entitlement.tier,
              subscription_expires_at: expiresAt.toISOString(),
            })
            .eq("user_id", profile.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        await clearSubscription(customerId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        await syncSubscription(customerId, sub);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

        if (!customerId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(customerId, sub);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
