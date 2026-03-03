import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SparkCard from "@/components/sparks/SparkCard";
import SparkEmptyState from "@/components/sparks/SparkEmptyState";
import BottomNav from "@/components/BottomNav";

const filters = ["All", "This Week", "Archived"] as const;
type Filter = (typeof filters)[number];

interface SparkWithPartner {
  id: string;
  call_id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  is_archived: boolean | null;
  ai_insight: string | null;
  voice_intro_a: string | null;
  voice_intro_b: string | null;
  partner_id: string;
  partner_name: string;
  partner_voice_status: "available" | "skipped" | "none";
}

const SparkHistory = () => {
  const { user } = useAuth();
  const [active, setActive] = useState<Filter>("All");

  const { data: sparks = [] } = useQuery<SparkWithPartner[]>({
    queryKey: ["sparks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("sparks")
        .select("id, call_id, user_a, user_b, created_at, is_archived, ai_insight, voice_intro_a, voice_intro_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get partner display names
      const partnerIds = (data || []).map((s) =>
        s.user_a === user.id ? s.user_b : s.user_a
      );
      const uniqueIds = [...new Set(partnerIds)];

      const profileMap: Record<string, string> = {};
      if (uniqueIds.length > 0) {
        // Use RPC to fetch only safe fields for spark partners
        const results = await Promise.all(
          uniqueIds.map((uid) =>
            supabase.rpc("get_spark_partner_profile", { _partner_user_id: uid })
          )
        );
        results.forEach(({ data: profiles }) => {
          if (profiles) {
            profiles.forEach((p: { user_id: string; display_name: string | null }) => {
              const firstName = p.display_name?.split(" ")[0] || "Spark";
              profileMap[p.user_id] = firstName;
            });
          }
        });
      }

      return (data || []).map((s) => {
        const partnerId = s.user_a === user.id ? s.user_b : s.user_a;
        const partnerVoice = s.user_a === user.id ? s.voice_intro_b : s.voice_intro_a;
        const voiceStatus: "available" | "skipped" | "none" =
          !partnerVoice ? "none" : partnerVoice === "skipped" ? "skipped" : "available";
        return {
          ...s,
          partner_id: partnerId,
          partner_name: profileMap[partnerId] || `Spark ${s.id.slice(-4)}`,
          partner_voice_status: voiceStatus,
        };
      });
    },
    enabled: !!user,
  });

  const filtered = sparks.filter((s) => {
    if (active === "Archived") return s.is_archived;
    if (active === "This Week") {
      return !s.is_archived && Date.now() - new Date(s.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    return !s.is_archived;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-5 pt-5 pb-4">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl text-foreground mb-4">
            Your Sparks
          </motion.h1>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button key={f} onClick={() => setActive(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-300 ${
                  active === f
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-5 pt-5">
        {filtered.length === 0 ? (
          <SparkEmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map((spark, i) => (
              <SparkCard key={spark.id} spark={spark} index={i} />
            ))}
          </div>
        )}
      </main>

      <BottomNav activeTab="sparks" />
    </div>
  );
};

export default SparkHistory;
