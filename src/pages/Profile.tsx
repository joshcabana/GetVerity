import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Check, LogOut, Crown, Shield, Phone, ScanFace, Coins, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const Profile = () => {
  const { user, profile, userTrust, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.display_name ?? "");
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const tokenBalance = profile?.token_balance ?? 0;
  const subscriptionTier = profile?.subscription_tier ?? "free";
  const subscriptionExpiry = profile?.subscription_expires_at;
  const avatarUrl = localAvatarUrl ?? profile?.avatar_url;

  const isPassHolder = subscriptionTier === "pass_monthly" || subscriptionTier === "pass_annual";

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase.rpc("update_my_profile", {
        p_display_name: newName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Display name updated");
      setEditingName(false);
    },
    onError: () => toast.error("Failed to update name"),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const avatarUrlWithVersion = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateErr } = await supabase.rpc("update_my_profile", {
        p_avatar_url: avatarUrlWithVersion,
      });
      if (updateErr) throw updateErr;

      toast.success("Avatar updated");
      setLocalAvatarUrl(avatarUrlWithVersion);
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Unable to open subscription portal");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const verifications = [
    { label: "Phone", done: !!userTrust?.phone_verified, icon: Phone },
    { label: "Selfie", done: !!userTrust?.selfie_verified, icon: ScanFace },
    { label: "Safety Pledge", done: !!userTrust?.safety_pledge_accepted, icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-5 pt-5 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl text-foreground"
          >
            Profile
          </motion.h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-5 pt-8 space-y-8">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-border">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-2xl font-serif">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="w-48 text-center"
                maxLength={30}
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => updateNameMutation.mutate(nameValue.trim())}
                disabled={!nameValue.trim() || updateNameMutation.isPending}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setNameValue(displayName); setEditingName(true); }}
              className="flex items-center gap-2 group"
            >
              <span className="font-serif text-xl text-foreground">{displayName}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </motion.div>

        {/* Verification Badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-5"
        >
          <h2 className="text-sm font-medium text-foreground mb-4">Verification Status</h2>
          <div className="flex flex-wrap gap-3">
            {verifications.map((v) => (
              <Badge
                key={v.label}
                variant={v.done ? "default" : "secondary"}
                className="flex items-center gap-1.5 px-3 py-1.5"
              >
                {v.done ? <Check className="w-3 h-3" /> : <v.icon className="w-3 h-3" />}
                {v.label}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Token Balance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-lg border border-border bg-card p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Token Balance</p>
              <p className="text-2xl font-serif text-foreground tabular-nums">{tokenBalance}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/tokens"}>
            Get more
          </Button>
        </motion.div>

        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Subscription</p>
              <p className="text-xs text-muted-foreground">
                {isPassHolder
                  ? `Verity Pass · ${subscriptionTier === "pass_annual" ? "Annual" : "Monthly"}`
                  : "Free tier"}
              </p>
            </div>
          </div>

          {isPassHolder && subscriptionExpiry && (
            <p className="text-xs text-muted-foreground mb-4">
              Renews {format(new Date(subscriptionExpiry), "d MMM yyyy")}
            </p>
          )}

          {isPassHolder ? (
            <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
              Manage subscription
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => window.location.href = "/tokens"}>
              Upgrade to Verity Pass
            </Button>
          )}
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </motion.div>
      </main>

      <BottomNav activeTab="profile" />
    </div>
  );
};

export default Profile;
