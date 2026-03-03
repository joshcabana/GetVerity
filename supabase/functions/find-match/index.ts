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
    // Auth user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client to get auth user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    // Service role client for matching logic
    const admin = createClient(supabaseUrl, serviceKey);

    const { drop_id, room_id } = await req.json();
    if (!drop_id || !room_id) throw new Error("drop_id and room_id required");

    // Server-side trust gate: verify user has completed identity checks
    const { data: trust, error: trustErr } = await admin
      .from("user_trust")
      .select("selfie_verified, safety_pledge_accepted, phone_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (trustErr || !trust) throw new Error("Trust verification failed");
    if (!trust.selfie_verified || !trust.safety_pledge_accepted) {
      throw new Error("Identity verification incomplete");
    }

    // Check phone requirement from feature flags
    const { data: phoneFlag } = await admin
      .from("app_config")
      .select("value_json")
      .eq("key", "feature_flags")
      .maybeSingle();

    const requirePhone = (phoneFlag?.value_json as Record<string, boolean> | null)?.require_phone_verification ?? true;
    if (requirePhone && !trust.phone_verified) {
      throw new Error("Phone verification required");
    }

    // Verify drop exists and is live
    const { data: drop, error: dropErr } = await admin
      .from("drops")
      .select("id, status, scheduled_at")
      .eq("id", drop_id)
      .single();
    if (dropErr || !drop) throw new Error("Drop not found");
    if (drop.status !== "live") {
      // Allow within 5 min grace after scheduled
      const scheduledTime = new Date(drop.scheduled_at).getTime();
      const now = Date.now();
      if (drop.status !== "upcoming" || now < scheduledTime || now - scheduledTime > 5 * 60 * 1000) {
        throw new Error("Drop is not live");
      }
    }

    // Join queue without mutating an already-existing row (important for polling safety).
    const { error: joinErr } = await admin
      .from("matchmaking_queue")
      .upsert(
        { user_id: user.id, room_id, drop_id, status: "waiting", joined_at: new Date().toISOString() },
        { onConflict: "user_id,drop_id", ignoreDuplicates: true }
      );
    if (joinErr) {
      console.error("Queue join error:", joinErr);
      throw new Error("Failed to join queue");
    }

    // Read current queue state for this user/drop.
    const { data: selfQueue, error: selfQueueErr } = await admin
      .from("matchmaking_queue")
      .select("id, status, call_id")
      .eq("user_id", user.id)
      .eq("drop_id", drop_id)
      .single();

    if (selfQueueErr || !selfQueue) {
      console.error("Self queue lookup error:", selfQueueErr);
      throw new Error("Matchmaking temporarily unavailable");
    }

    // If this poll cycle is already matched, return the existing match immediately.
    if (selfQueue.status === "matched" && selfQueue.call_id) {
      const { data: existingCall } = await admin
        .from("calls")
        .select("id, agora_channel")
        .eq("id", selfQueue.call_id)
        .single();

      if (existingCall?.agora_channel) {
        return new Response(
          JSON.stringify({
            status: "matched",
            call_id: existingCall.id,
            agora_channel: existingCall.agora_channel,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Only waiting rows can enter the claim flow.
    if (selfQueue.status !== "waiting") {
      return new Response(
        JSON.stringify({ status: "queued" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomically claim a compatible candidate in SQL using row-level locks.
    const { data: claimRows, error: claimErr } = await admin.rpc("claim_match_candidate", {
      p_user_id: user.id,
      p_drop_id: drop_id,
    });

    if (claimErr) {
      console.error("Candidate claim error:", claimErr);
      throw new Error("Matchmaking temporarily unavailable");
    }

    const claimed = claimRows?.[0];
    if (!claimed) {
      return new Response(
        JSON.stringify({ status: "queued" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the call
    const shortId = crypto.randomUUID().slice(0, 8);
    const agora_channel = `drop_${drop_id.slice(0, 8)}_${shortId}`;

    const { data: call, error: callErr } = await admin
      .from("calls")
      .insert({
        caller_id: user.id,
        callee_id: claimed.candidate_user_id,
        room_id,
        status: "active",
        started_at: new Date().toISOString(),
        duration_seconds: 45,
        agora_channel,
      })
      .select("id")
      .single();

    if (callErr || !call) {
      // Rollback queue claim if call creation fails.
      await admin
        .from("matchmaking_queue")
        .update({ status: "waiting", matched_at: null, call_id: null })
        .in("id", [selfQueue.id, claimed.candidate_queue_id]);
      throw new Error("Failed to create call");
    }

    // Finalize both queue entries to matched.
    const now = new Date().toISOString();
    const { error: finalizeErr } = await admin
      .from("matchmaking_queue")
      .update({ status: "matched", matched_at: now, call_id: call.id })
      .in("id", [selfQueue.id, claimed.candidate_queue_id]);

    if (finalizeErr) {
      console.error("Queue finalize error:", finalizeErr);
      await admin.from("calls").delete().eq("id", call.id);
      await admin
        .from("matchmaking_queue")
        .update({ status: "waiting", matched_at: null, call_id: null })
        .in("id", [selfQueue.id, claimed.candidate_queue_id]);
      throw new Error("Failed to finalize match");
    }

    return new Response(
      JSON.stringify({
        status: "matched",
        call_id: call.id,
        agora_channel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("find-match error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    const safeMessages = [
      "Drop not found",
      "Drop is not live",
      "drop_id and room_id required",
      "Unauthorized",
      "Missing auth",
      "Failed to join queue",
      "Matchmaking temporarily unavailable",
      "Failed to create call",
      "Failed to finalize match",
      "Trust verification failed",
      "Identity verification incomplete",
      "Phone verification required",
    ];
    const msg = safeMessages.includes(errorMessage) ? errorMessage : "An error occurred";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
