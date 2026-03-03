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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: call } = await adminClient
      .from("calls")
      .select("id, caller_id, callee_id, recording_resource_id, recording_sid")
      .eq("id", call_id)
      .single();

    if (!call || (call.caller_id !== user.id && call.callee_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!call.recording_resource_id || !call.recording_sid) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_active_recording" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authValue = btoa(`${customerKey}:${customerSecret}`);
    const baseUrl = `https://api.agora.io/v1/apps/${agoraAppId}/cloud_recording`;

    const stopRes = await fetch(
      `${baseUrl}/resourceid/${call.recording_resource_id}/sid/${call.recording_sid}/mode/mix/stop`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authValue}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cname: channel,
          uid: "1",
          clientRequest: {},
        }),
      }
    );

    if (!stopRes.ok) {
      const errText = await stopRes.text();
      console.error("Agora stop failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to stop recording" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stopData = await stopRes.json();

    // Extract recording URL from server response
    const fileList = stopData?.serverResponse?.fileList;
    let recordingUrl: string | null = null;
    if (Array.isArray(fileList) && fileList.length > 0) {
      // Prefer mp4
      const mp4File = fileList.find((f: { fileName: string }) => f.fileName?.endsWith(".mp4"));
      recordingUrl = (mp4File || fileList[0])?.fileName || null;
    } else if (typeof fileList === "string") {
      recordingUrl = fileList;
    }

    // Update call with recording URL
    await adminClient
      .from("calls")
      .update({ recording_url: recordingUrl })
      .eq("id", call_id);

    return new Response(JSON.stringify({ stopped: true, recording_url: recordingUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stop-cloud-recording error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
