import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, MoreHorizontal, Flag, Ban, Archive } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatComposer from "@/components/chat/ChatComposer";

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  is_read: boolean | null;
}

const Chat = () => {
  const { sparkId } = useParams<{ sparkId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("Spark");
  const [partnerId, setPartnerId] = useState<string | null>(null);

  // Fetch spark data
  useEffect(() => {
    if (!sparkId || !user) return;
    const fetchSpark = async () => {
      const { data: spark } = await supabase
        .from("sparks")
        .select("user_a, user_b")
        .eq("id", sparkId)
        .single();
      if (!spark) return;

      const pid = spark.user_a === user.id ? spark.user_b : spark.user_a;
      setPartnerId(pid);

      const { data: profiles } = await supabase
        .rpc("get_spark_partner_profile", { _partner_user_id: pid });
      if (profiles && profiles.length > 0 && profiles[0].display_name) {
        setPartnerName(profiles[0].display_name.split(" ")[0]);
      }
    };
    fetchSpark();
  }, [sparkId, user]);

  // Fetch messages
  useEffect(() => {
    if (!sparkId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, is_read")
        .eq("spark_id", sparkId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [sparkId]);

  // Realtime messages
  useEffect(() => {
    if (!sparkId) return;
    const channel = supabase
      .channel(`chat-${sparkId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `spark_id=eq.${sparkId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sparkId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread partner messages as read
  useEffect(() => {
    if (!user || !messages.length) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== user.id && m.is_read === false)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", unreadIds)
      .then();
  }, [messages, user]);

  const handleSend = useCallback(async (text: string) => {
    if (!user || !sparkId) return;
    const { error } = await supabase.from("messages").insert({
      spark_id: sparkId,
      sender_id: user.id,
      content: text,
    });
    if (error) toast.error("Failed to send message");
  }, [user, sparkId]);

  const handleReport = useCallback(async () => {
    if (!user || !partnerId) return;
    setMenuOpen(false);
    const reason = "Reported from chat".slice(0, 1000).trim();
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: partnerId,
      reason,
    });
    if (error) {
      toast.error("Failed to submit report.");
      return;
    }
    toast.success("Report submitted.");
  }, [user, partnerId]);

  const handleBlock = useCallback(async () => {
    if (!user || !partnerId || !sparkId) return;
    setMenuOpen(false);
    await supabase.from("user_blocks").insert({
      blocker_id: user.id,
      blocked_id: partnerId,
    });
    // Archive the spark
    await supabase.from("sparks").update({ is_archived: true }).eq("id", sparkId);
    toast.success("User blocked.");
    navigate("/sparks");
  }, [user, partnerId, sparkId, navigate]);

  const handleArchive = useCallback(async () => {
    if (!sparkId) return;
    setMenuOpen(false);
    await supabase.from("sparks").update({ is_archived: true }).eq("id", sparkId);
    toast.success("Spark archived.");
    navigate("/sparks");
  }, [sparkId, navigate]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate("/sparks")}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border">
              <User className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-foreground truncate">{partnerName}</h2>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-10 w-44 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
                <button onClick={handleReport}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
                <button onClick={handleBlock}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <Ban className="w-3.5 h-3.5" /> Block
                </button>
                <button onClick={handleArchive}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <Archive className="w-3.5 h-3.5" /> Archive Spark
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">You sparked! Say hello.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={user?.id || ""} index={i} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatComposer onSend={handleSend} />
    </div>
  );
};

export default Chat;
