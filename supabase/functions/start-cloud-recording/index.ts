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
    const agoraAppId = Deno.env.get("AGORA_APP_ID");
    const customerKey = Deno.env.get("AGORA_CUSTOMER_KEY");
    const customerSecret = Deno.env.get("AGORA_CUSTOMER_SECRET");

    if (!agoraAppId || !customerKey || !customerSecret) {
      console.warn("Agora Cloud Recording credentials not configured — skipping recording");
      return new Response(JSON.stringify({ skipped: true, reason: "credentials_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { call_id, channel } = await req.json();
    if (!call_id || !channel) {
      return new Response(JSON.stringify({ error: "call_id and channel required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is participant
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: call } = await adminClient
      .from("calls")
      .select("id, caller_id, callee_id")
      .eq("id", call_id)
      .single();

    if (!call || (call.caller_id !== user.id && call.callee_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authValue = btoa(`${customerKey}:${customerSecret}`);
    const baseUrl = `https://api.agora.io/v1/apps/${agoraAppId}/cloud_recording`;

    // Step 1: Acquire
    const acquireRes = await fetch(`${baseUrl}/acquire`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authValue}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cname: channel,
        uid: "1", // recording bot UID
        clientRequest: { resourceExpiredHour: 24 },
      }),
    });

    if (!acquireRes.ok) {
      const errText = await acquireRes.text();
      console.error("Agora acquire failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to acquire recording resource" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { resourceId } = await acquireRes.json();

    // Step 2: Start recording (composite mode)
    const startRes = await fetch(`${baseUrl}/resourceid/${resourceId}/mode/mix/start`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authValue}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cname: channel,
        uid: "1",
        clientRequest: {
          recordingConfig: {
            channelType: 1, // live broadcast
            streamTypes: 2, // video only for replay
            maxIdleTime: 60,
            transcodingConfig: {
              width: 640,
              height: 480,
              fps: 15,
              bitrate: 500,
              mixedVideoLayout: 1, // best fit
            },
          },
          recordingFileConfig: {
            avFileType: ["hls", "mp4"],
          },
          // Storage config would go here — requires user's cloud storage bucket
          // For MVP, we use Agora's default temporary storage
        },
      }),
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      console.error("Agora start failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to start recording" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startData = await startRes.json();
    const sid = startData.sid;

    // Store resourceId and sid on the call
    await adminClient
      .from("calls")
      .update({ recording_resource_id: resourceId, recording_sid: sid })
      .eq("id", call_id);

    return new Response(JSON.stringify({ resourceId, sid, started: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("start-cloud-recording error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
