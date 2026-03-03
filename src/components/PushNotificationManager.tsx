import { usePushSubscription } from "@/hooks/usePushSubscription";

/** Invisible component — registers push subscription when user is authenticated */
const PushNotificationManager = () => {
  usePushSubscription();
  return null;
};

export default PushNotificationManager;
