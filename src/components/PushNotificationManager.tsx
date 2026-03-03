import { forwardRef } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

/** Invisible component — registers push subscription when user is authenticated */
const PushNotificationManager = forwardRef<HTMLDivElement>((_, _ref) => {
  usePushSubscription();
  return null;
});
PushNotificationManager.displayName = "PushNotificationManager";

export default PushNotificationManager;
