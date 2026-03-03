import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { spark_id } = await req.json();
    if (!spark_id) {
      return new Response(JSON.stringify({ error: "spark_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a participant in the spark
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: spark, error: sparkError } = await adminClient
      .from("sparks")
      .select("id, call_id, user_a, user_b")
      .eq("id", spark_id)
      .single();

    if (sparkError || !spark) {
      return new Response(JSON.stringify({ error: "Spark not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (spark.user_a !== user.id && spark.user_b !== user.id) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if replay already exists
    const { data: existing } = await adminClient
      .from("chemistry_replays")
      .select("id, status")
      .eq("spark_id", spark_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ replay_id: existing.id, status: existing.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recording URL from the call
    const { data: call } = await adminClient
      .from("calls")
      .select("recording_url")
      .eq("id", spark.call_id)
      .single();

    const recordingUrl = call?.recording_url || null;

    // Create replay record
    const { data: replay, error: insertError } = await adminClient
      .from("chemistry_replays")
      .insert({
        spark_id: spark.id,
        call_id: spark.call_id,
        user_a: spark.user_a,
        user_b: spark.user_b,
        status: recordingUrl ? "ready" : "processing",
        video_url: recordingUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create replay" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no recording URL, mark as failed (no cloud recording configured)
    if (!recordingUrl) {
      await adminClient
        .from("chemistry_replays")
        .update({ status: "failed" })
        .eq("id", replay.id);
    }

    return new Response(JSON.stringify({
      replay_id: replay.id,
      status: recordingUrl ? "ready" : "failed",
      has_recording: !!recordingUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-replay error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
