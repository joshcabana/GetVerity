import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_ids: string[];
  title: string;
  body: string;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    webpush.setVapidDetails(
      "mailto:hello@getverity.com.au",
      vapidPublicKey,
      vapidPrivateKey
    );

    const { user_ids, title, body, url } =
      (await req.json()) as PushPayload;

    if (!user_ids?.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing user_ids, title, or body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch push subscriptions for all target users
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id")
      .in("user_id", user_ids);

    if (fetchError || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
      icon: "/favicon.png",
      badge: "/favicon.png",
    });

    let sent = 0;
    const staleIds: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired or invalid — mark for cleanup
            staleIds.push(sub.id);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ sent, cleaned: staleIds.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
