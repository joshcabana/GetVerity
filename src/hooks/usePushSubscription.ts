import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { user, onboardingComplete } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || !onboardingComplete || registeredRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    registeredRef.current = true;
    registerPushSubscription(user.id).catch(() => {
      // Silent fail — push is best-effort
      registeredRef.current = false;
    });
  }, [user, onboardingComplete]);
}

async function registerPushSubscription(userId: string) {
  // Register service worker
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // Check for existing subscription
  const pm = (registration as unknown as { pushManager: PushManager }).pushManager;
  const existing = await pm.getSubscription();
  if (existing) {
    await saveSubscription(userId, existing);
    return;
  }

  // Get VAPID public key from app_config
  const { data: config } = await supabase
    .from("app_config")
    .select("value_json")
    .eq("key", "vapid_public_key")
    .single();

  if (!config?.value_json) return;

  const publicKey = config.value_json as string;

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  // Subscribe
  const pm2 = (registration as unknown as { pushManager: PushManager }).pushManager;
  const keyArray = urlBase64ToUint8Array(publicKey);
  const subscription = await pm2.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyArray.buffer as ArrayBuffer,
  });

  await saveSubscription(userId, subscription);
}

async function saveSubscription(userId: string, subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}
