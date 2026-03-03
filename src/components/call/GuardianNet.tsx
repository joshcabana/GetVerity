import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GuardianNetProps {
  open: boolean;
  onClose: () => void;
  callId: string;
}

const GuardianNet = ({ open, onClose, callId }: GuardianNetProps) => {
  const { user } = useAuth();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!open || !callId || !user || loggedRef.current) return;
    loggedRef.current = true;
    supabase.from("guardian_alerts").insert({ call_id: callId, user_id: user.id }).then();
  }, [open, callId, user]);

  useEffect(() => {
    if (!open) loggedRef.current = false;
  }, [open]);

  if (!open) return null;

  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + 5);
  const timeStr = endTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-card border border-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg text-foreground">Guardian Net</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Guardian Net is in beta. Trusted-contact delivery is not enabled yet.
        </p>
        <div className="bg-secondary rounded-md p-4 mb-6 text-sm text-foreground/80">
          Preview message: "In Verity call until {timeStr}"
        </div>
        <p className="text-xs text-muted-foreground/50 mb-6">
          This is currently a preview-only flow. Enablement is planned before pilot launch.
        </p>
        <Button variant="gold" size="lg" className="w-full" disabled>
          Coming soon
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default GuardianNet;
