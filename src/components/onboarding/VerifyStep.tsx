import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Shield, Phone, Camera, Check, ArrowRight, ShieldCheck,
  CheckCircle, Sparkles, Calendar, UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuthCapabilities } from "@/hooks/useAuthCapabilities";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";

interface VerifyStepProps {
  onComplete: () => void;
}

interface Drop {
  id: string;
  title: string;
  scheduled_at: string;
  rooms: { name: string } | null;
}

type SubStep = "pledge" | "phone" | "selfie" | "done";

const VerifyStep = ({ onComplete }: VerifyStepProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: featureFlags } = useFeatureFlags();
  const { data: authCapabilities } = useAuthCapabilities();

  const requirePhone = featureFlags?.requirePhoneVerification ?? false;
  const phoneAvailable = authCapabilities?.phoneEnabled !== false;

  // Sub-step state
  const [subStep, setSubStep] = useState<SubStep>("pledge");
  const [pledgeAccepted, setPledgeAccepted] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Selfie state
  const [capturing, setCapturing] = useState(false);
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Drop teaser
  const [nextDrop, setNextDrop] = useState<Drop | null>(null);

  useEffect(() => {
    supabase
      .from("drops")
      .select("id, title, scheduled_at, rooms(name)")
      .eq("status", "upcoming")
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setNextDrop(data[0] as unknown as Drop);
      });
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handlePledgeContinue = () => {
    if (requirePhone && phoneAvailable) {
      setSubStep("phone");
    } else {
      setSubStep("selfie");
    }
  };

  // ── Phone ──
  const formatAuPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+61" + digits.slice(1);
    if (digits.startsWith("61")) return "+" + digits;
    if (digits.startsWith("+61")) return digits;
    return "+61" + digits;
  };

  const handlePhoneSendOtp = async () => {
    const formatted = formatAuPhone(phone);
    if (formatted.length < 12) {
      toast({ title: "Invalid number", description: "Please enter an Australian mobile number.", variant: "destructive" });
      return;
    }
    setPhoneLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (error) throw error;
      setPhoneOtpSent(true);
      toast({ title: "Code sent", description: "Check your phone for a verification code." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePhoneVerify = async () => {
    if (phoneOtp.length < 6) return;
    setPhoneLoading(true);
    try {
      const formatted = formatAuPhone(phone);
      const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: phoneOtp, type: "sms" });
      if (error) throw error;
      // Save phone_verified
      if (user) {
        await supabase.from("user_trust").upsert({ user_id: user.id, phone_verified: true }, { onConflict: "user_id" });
      }
      setSubStep("selfie");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Invalid code", description: message, variant: "destructive" });
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Selfie ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCapturing(true);
    } catch {
      sonnerToast.error("Camera access denied. You can verify later.");
    }
  }, []);

  const captureAndUpload = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    setUploading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return; }
      const path = `selfies/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("verifications").upload(path, blob, { contentType: "image/jpeg" });
      if (error) {
        sonnerToast.error("Upload failed. Try again.");
        setUploading(false);
        return;
      }
      setSelfieCaptured(true);
      setCapturing(false);
      setUploading(false);
      sonnerToast.success("Selfie captured!");
    }, "image/jpeg", 0.85);
  }, [user]);

  const finishVerification = async () => {
    if (!user) return;
    await supabase.from("user_trust").upsert({
      user_id: user.id,
      safety_pledge_accepted: true,
      selfie_verified: selfieCaptured,
      onboarding_step: 3,
      onboarding_complete: true,
    }, { onConflict: "user_id" });
    onComplete();
  };

  const skipSelfie = async () => {
    setSelfieCaptured(false);
    setSubStep("done");
  };

  // When selfie is captured, move to done
  useEffect(() => {
    if (selfieCaptured) setSubStep("done");
  }, [selfieCaptured]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center px-6 max-w-sm mx-auto w-full"
    >
      <AnimatePresence mode="wait">
        {/* ── PLEDGE ── */}
        {subStep === "pledge" && (
          <motion.div key="pledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-2">
              Last step: Verify once
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Takes 12 seconds. Never asked again.
            </p>

            <div className="space-y-3 text-left w-full mb-6">
              {[
                "No harassment. No pressure. No sexual content.",
                "If someone asks to leave, you let them leave.",
                "Report what matters — we act fast.",
              ].map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6 w-full">
              <Checkbox
                id="pledge"
                checked={pledgeAccepted}
                onCheckedChange={(v) => setPledgeAccepted(v === true)}
              />
              <label htmlFor="pledge" className="text-sm text-foreground cursor-pointer">
                I agree to the Verity Safety Pledge.
              </label>
            </div>

            <Button
              variant="gold"
              size="lg"
              onClick={handlePledgeContinue}
              disabled={!pledgeAccepted}
              className="w-full group"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="mt-6 text-[10px] text-muted-foreground/50">
              AU Privacy Act compliant · Encrypted & deleted after check
            </p>
          </motion.div>
        )}

        {/* ── PHONE ── */}
        {subStep === "phone" && (
          <motion.div key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-2">
              {phoneOtpSent ? "Verify your number" : "Quick phone check"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {phoneOtpSent ? "Enter the 6-digit code we just sent." : "Keeps Verity safe and bot-free. We never share your number."}
            </p>

            {!phoneOtpSent ? (
              <div className="w-full space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="04XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 h-12 bg-card border-border"
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneSendOtp()}
                  />
                </div>
                <Button variant="gold" size="lg" onClick={handlePhoneSendOtp} className="w-full" disabled={phoneLoading || phone.length < 8}>
                  {phoneLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>Send code <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <Input
                  type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 bg-card border-border text-center text-lg tracking-[0.5em] font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneVerify()}
                />
                <Button variant="gold" size="lg" onClick={handlePhoneVerify} className="w-full" disabled={phoneLoading || phoneOtp.length < 6}>
                  {phoneLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Verify</>}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── SELFIE ── */}
        {subStep === "selfie" && (
          <motion.div key="selfie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            {!capturing ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-2">Selfie verification</h2>
                <p className="text-muted-foreground text-sm mb-3">
                  A quick liveness check proves you're real. Verified members get exclusive Drops.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-primary/80 mb-8">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Processed on-device · never stored publicly</span>
                </div>
                <div className="w-full space-y-3">
                  <Button variant="gold" size="lg" onClick={startCamera} className="w-full">
                    <Camera className="mr-2 h-4 w-4" /> Take selfie now
                  </Button>
                  <Button variant="outline" size="lg" onClick={skipSelfie} className="w-full text-muted-foreground">
                    I'll do this later <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full">
                <div className="relative rounded-2xl overflow-hidden mb-6 bg-secondary">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button variant="gold" size="lg" onClick={captureAndUpload} disabled={uploading} className="w-full">
                  {uploading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Camera className="mr-2 h-4 w-4" /> Capture</>}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DONE ── */}
        {subStep === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto"
            >
              <CheckCircle className="w-8 h-8 text-primary" />
            </motion.div>

            <h2 className="font-serif text-2xl text-foreground mb-2">
              ✅ Verified · You're in the next Drop!
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Welcome to Verity. Real chemistry starts now.
            </p>

            {/* Drop teaser */}
            {nextDrop && (
              <div className="w-full p-4 rounded-xl border border-primary/20 bg-card mb-8 text-left">
                {nextDrop.rooms?.name && (
                  <span className="text-[10px] uppercase tracking-luxury text-primary/80 block mb-1">
                    {nextDrop.rooms.name}
                  </span>
                )}
                <p className="text-sm font-medium text-foreground">{nextDrop.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(nextDrop.scheduled_at), "EEE d MMM · h:mm a")}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/drops/friendfluence${nextDrop ? `?drop=${nextDrop.id}` : ""}`)}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Bring a Friend to this Drop
            </Button>

            <Button variant="gold" size="lg" onClick={finishVerification} className="w-full group mt-3">
              <Sparkles className="mr-2 h-4 w-4" />
              Enter the Lobby
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VerifyStep;
