import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, Square, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoiceIntroProps {
  sparkId: string;
  onComplete: () => void;
}

type VoicePhase = "intro" | "recording" | "recorded" | "listening" | "done";

/** Helper: check if both voice intro columns are populated (non-null string) */
const bothIntrosReady = (a: string | null | undefined, b: string | null | undefined): boolean =>
  typeof a === "string" && a.length > 0 && typeof b === "string" && b.length > 0;

const VoiceIntro = ({ sparkId, onComplete }: VoiceIntroProps) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<VoicePhase>("intro");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const MAX_SECONDS = 15;

  // Recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Spark role detection
  const [myColumn, setMyColumn] = useState<"voice_intro_a" | "voice_intro_b" | null>(null);

  // Detect which column belongs to the current user
  useEffect(() => {
    if (!user || !sparkId) return;
    const detect = async () => {
      const { data } = await supabase
        .from("sparks")
        .select("user_a, user_b")
        .eq("id", sparkId)
        .single();
      if (data) {
        setMyColumn(data.user_a === user.id ? "voice_intro_a" : "voice_intro_b");
      }
    };
    detect();
  }, [user, sparkId]);

  // Recording timer
  useEffect(() => {
    if (phase !== "recording") return;
    if (recordSeconds >= MAX_SECONDS) {
      // Auto-stop recording at limit
      mediaRecorderRef.current?.stop();
      return;
    }
    const t = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, recordSeconds]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setPhase("recorded");
        // Stop mic
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect chunks every 1s
      setRecordSeconds(0);
      setPhase("recording");
    } catch {
      toast.error("Microphone access denied. You can skip the voice intro.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // Self-playback toggle
  const togglePlayback = useCallback(() => {
    if (!audioBlob) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
  }, [audioBlob, isPlaying]);

  // Send: upload blob and write raw path to DB
  const sendVoiceIntro = useCallback(async () => {
    if (!audioBlob || !user || !myColumn) return;
    setPhase("listening");

    const path = `${user.id}/${sparkId}/${Date.now()}.webm`;

    const { error: uploadErr } = await supabase.storage
      .from("voice-intros")
      .upload(path, audioBlob, { contentType: "audio/webm" });

    if (uploadErr) {
      toast.error("Upload failed. Please try again.");
      setPhase("recorded");
      return;
    }

    // Store raw path in the correct column
    const { error: dbErr } = await supabase
      .from("sparks")
      .update({ [myColumn]: path })
      .eq("id", sparkId);

    if (dbErr) {
      toast.error("Failed to save voice intro.");
      setPhase("recorded");
      return;
    }

    // Check if partner already submitted — if so, go straight to done
    const { data: spark } = await supabase
      .from("sparks")
      .select("voice_intro_a, voice_intro_b")
      .eq("id", sparkId)
      .single();

    if (spark && bothIntrosReady(spark.voice_intro_a, spark.voice_intro_b)) {
      setPhase("done");
    }
    // Otherwise stay in "listening" — realtime subscription handles transition
  }, [audioBlob, user, myColumn, sparkId]);

  // Skip: write "skipped" to DB
  const handleSkip = useCallback(async () => {
    if (!user || !myColumn) {
      onComplete();
      return;
    }

    const { error: dbErr } = await supabase
      .from("sparks")
      .update({ [myColumn]: "skipped" })
      .eq("id", sparkId);

    if (dbErr) {
      // Fail gracefully — still unlock
      onComplete();
      return;
    }

    // Check if partner also ready
    const { data: spark } = await supabase
      .from("sparks")
      .select("voice_intro_a, voice_intro_b")
      .eq("id", sparkId)
      .single();

    if (spark && bothIntrosReady(spark.voice_intro_a, spark.voice_intro_b)) {
      setPhase("done");
    } else {
      setPhase("listening");
    }
  }, [user, myColumn, sparkId, onComplete]);

  // Realtime subscription during "listening" phase
  useEffect(() => {
    if (phase !== "listening" || !sparkId) return;

    const channel = supabase
      .channel(`voice-intro-${sparkId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "sparks",
        filter: `id=eq.${sparkId}`,
      }, (payload) => {
        const row = payload.new as { voice_intro_a: string | null; voice_intro_b: string | null };
        if (bothIntrosReady(row.voice_intro_a, row.voice_intro_b)) {
          setPhase("done");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [phase, sparkId]);

  return (
    <motion.div
      key="voice-intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md text-center"
      >
        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-2">Verity Voice Intro</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Record a 15-second voice note to introduce yourself. More human than text — and it filters deeper.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ─── INTRO ─── */}
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button variant="gold" size="xl" onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" />
                Start recording
              </Button>
              <p className="text-xs text-muted-foreground/50 mt-4">Up to 15 seconds · Optional</p>
              <button
                onClick={handleSkip}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip voice intro
              </button>
            </motion.div>
          )}

          {/* ─── RECORDING ─── */}
          {phase === "recording" && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Waveform visualization */}
              <div className="flex items-center justify-center gap-1 h-16 mb-6">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [8, 16 + Math.random() * 24, 8],
                    }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                    className="w-1 rounded-full bg-primary/60"
                  />
                ))}
              </div>

              <p className="text-sm text-foreground mb-2 tabular-nums">
                {recordSeconds}s / {MAX_SECONDS}s
              </p>

              {/* Progress bar */}
              <div className="w-48 h-1 rounded-full bg-secondary mx-auto mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${(recordSeconds / MAX_SECONDS) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <Button variant="outline" size="lg" onClick={stopRecording} className="gap-2">
                <Square className="w-3 h-3" />
                Stop
              </Button>
            </motion.div>
          )}

          {/* ─── RECORDED ─── */}
          {phase === "recorded" && (
            <motion.div key="recorded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-center gap-3 mb-6">
                <button
                  onClick={togglePlayback}
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  {isPlaying ? (
                    <Square className="w-4 h-4 text-foreground" />
                  ) : (
                    <Play className="w-4 h-4 text-foreground ml-0.5" />
                  )}
                </button>
                <p className="text-sm text-muted-foreground">{recordSeconds}s recorded</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="gold" size="lg" onClick={sendVoiceIntro} className="gap-2">
                  Send voice intro
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={startRecording} className="text-muted-foreground">
                  Re-record
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── LISTENING ─── */}
          {phase === "listening" && (
            <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-muted-foreground mb-6">Waiting for their voice intro…</p>
              <div className="flex items-center justify-center gap-1 h-12 mb-4">
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.06,
                    }}
                    className="w-1 h-6 rounded-full bg-primary/40"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── DONE ─── */}
          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <p className="font-serif text-xl text-foreground mb-2">Voice intros exchanged</p>
              <p className="text-sm text-muted-foreground mb-8">Chat is now unlocked.</p>
              <Button variant="gold" size="xl" onClick={onComplete}>
                Open conversation
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default VoiceIntro;
