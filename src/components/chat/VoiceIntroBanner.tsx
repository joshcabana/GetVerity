import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface VoiceIntroBannerProps {
  storagePath: string;
  matchName: string;
}

type BannerState = "loading" | "error" | "ready";

const VoiceIntroBanner = ({ storagePath, matchName }: VoiceIntroBannerProps) => {
  const [state, setState] = useState<BannerState>("loading");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const barHeights = useMemo(
    () => Array.from({ length: 30 }, (_, i) => 4 + Math.sin(i * 0.7) * 6 + Math.abs(Math.sin(i * 1.3)) * 4),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.storage
        .from("voice-intros")
        .createSignedUrl(storagePath, 3600);

      if (cancelled) return;
      if (error || !data?.signedUrl) {
        setState("error");
        return;
      }

      const audio = new Audio(data.signedUrl);
      audio.preload = "metadata";

      audio.addEventListener("loadedmetadata", () => {
        if (cancelled) return;
        setDuration(audio.duration);
        setState("ready");
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });

      audio.addEventListener("error", () => {
        if (!cancelled) setState("error");
      });

      audioRef.current = audio;
    };

    load();
    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [storagePath]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (state === "loading") {
    return (
      <div className="mx-4 mt-3 mb-1 p-3.5 rounded-lg bg-primary/[0.06] border border-primary/15">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-4 mt-3 mb-1 p-3.5 rounded-lg bg-primary/[0.06] border border-primary/15">
        <p className="text-[11px] text-muted-foreground/50 text-center">
          Voice intro unavailable
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mx-4 mt-3 mb-1 p-3.5 rounded-lg bg-primary/[0.06] border border-primary/15"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
        >
          {playing ? (
            <Pause className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground mb-1.5">
            {matchName}'s voice intro
          </p>
          <div className="flex items-center gap-[2px] h-5">
            {barHeights.map((height, i) => {
              const filled = (i / 30) * 100 < progress;
              return (
                <div
                  key={i}
                  className={`w-[3px] rounded-full transition-colors duration-150 ${
                    filled ? "bg-primary/70" : "bg-primary/20"
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground/50 tabular-nums flex-shrink-0">
          {duration > 0 ? formatDuration(duration) : "0:15"}
        </span>
      </div>
    </motion.div>
  );
};

export default VoiceIntroBanner;
