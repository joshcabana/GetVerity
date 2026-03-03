import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!user) return 0;

      // Get all spark IDs the user belongs to
      const { data: sparks } = await supabase
        .from("sparks")
        .select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (!sparks || sparks.length === 0) return 0;

      const sparkIds = sparks.map((s) => s.id);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("spark_id", sparkIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      return count ?? 0;
    },
  });
}
