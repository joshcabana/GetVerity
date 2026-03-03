import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Crown, Check, Sparkles, Zap, Clock, Star, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import SparkExtendModal from "@/components/tokens/SparkExtendModal";
import PurchaseSuccess from "@/components/tokens/PurchaseSuccess";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const tokenPacks = [
  { id: "starter", name: "Starter", tokens: 10, price: "$4.90", entries: 10, badge: null, price_id: "price_1T6rXLC1O032lUHcL3kvvio4" },
  { id: "popular", name: "Popular", tokens: 15, price: "$6.90", entries: 15, badge: "Most popular", price_id: "price_1T6rYJC1O032lUHc3fO3j6R6" },
  { id: "value", name: "Value", tokens: 30, price: "$11.90", entries: 30, badge: "Best value", price_id: "price_1T6rZ0C1O032lUHciuLq0TXN" },
] as const;

const passPerks = [
  { icon: Zap, text: "Priority matchmaking — top of every room" },
  { icon: Coins, text: "Unlimited free lobby entries" },
  { icon: Sparkles, text: "One free Spark Extension every day" },
  { icon: Star, text: "Access to all premium rooms" },
  { icon: Crown, text: "Ad-free experience, always" },
];

const TokenShop = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenBalance = profile?.token_balance ?? 0;
  const subscriptionTier = profile?.subscription_tier ?? "free";
  const isPassHolder = subscriptionTier === "pass_monthly" || subscriptionTier === "pass_annual";

  const [extendOpen, setExtendOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  // Handle ?success=true redirect from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setPurchaseSuccess("your purchase");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCheckout = async (priceId: string, label: string) => {
    setLoadingPriceId(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch {
      toast.error("Unable to start checkout. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPriceId("manage");
    try {
      const returnUrl = `${window.location.origin}/tokens`;
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { return_url: returnUrl },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Unable to open subscription portal");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-5 pt-5 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl text-foreground mb-1"
          >
            Credits & Pass
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium tabular-nums">
              {tokenBalance} tokens
            </span>
            <span className="text-xs text-muted-foreground/50">available</span>
          </motion.div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-5 pt-6">
        {/* Spark Extension */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setExtendOpen(true)}
          className="w-full flex items-center gap-4 p-4 rounded-lg bg-primary/[0.05] border border-primary/15 hover:border-primary/25 transition-all duration-400 mb-8 group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Extend your last spark</p>
            <p className="text-xs text-muted-foreground/60">Keep the conversation window open longer</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </motion.button>

        {/* Token Packs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="font-serif text-lg text-foreground mb-1">Token Packs</h2>
          <p className="text-xs text-muted-foreground/60 mb-5">Support more meaningful connections</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tokenPacks.map((pack, i) => {
              const isLoading = loadingPriceId === pack.price_id;
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={`relative rounded-lg border p-5 transition-all duration-400 ${
                    pack.id === "popular"
                      ? "border-primary/30 bg-primary/[0.04] shadow-[0_0_40px_hsl(43_72%_55%/0.05)]"
                      : "border-border bg-card hover:border-primary/15"
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-2.5 left-4">
                      <span className="text-[9px] tracking-luxury uppercase text-primary bg-background border border-primary/25 px-2.5 py-0.5 rounded-full">
                        {pack.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-luxury mb-1">{pack.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-2xl text-foreground">{pack.tokens}</span>
                      <span className="text-xs text-muted-foreground">tokens</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground/50 mb-4">Good for {pack.entries} lobby entries</p>

                  <div className="w-full h-[3px] rounded-full bg-secondary/60 overflow-hidden mb-5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(pack.tokens / 30) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full bg-primary/40"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{pack.price}</span>
                    <Button
                      variant={pack.id === "popular" ? "gold" : "gold-outline"}
                      size="sm"
                      disabled={!!loadingPriceId}
                      onClick={() => handleCheckout(pack.price_id, pack.name)}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="h-px bg-border mb-10" />

        {/* Verity Pass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-10"
        >
          <div className="rounded-xl border border-primary/25 bg-card p-6 shadow-[0_0_60px_hsl(43_72%_55%/0.04)]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">Verity Pass</h2>
                <p className="text-xs text-muted-foreground/60">The complete experience</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {passPerks.map((perk) => (
                <div key={perk.text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{perk.text}</p>
                </div>
              ))}
            </div>

            {!isPassHolder && (
              <div className="flex items-center gap-2 mb-5 bg-secondary/40 rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 py-2 rounded-md text-xs transition-all duration-300 ${
                    billingCycle === "monthly"
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly · $12.90
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`flex-1 py-2 rounded-md text-xs transition-all duration-300 relative ${
                    billingCycle === "annual"
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  Annual · $99
                  <span className="ml-1 text-[9px] text-primary">Save 36%</span>
                </button>
              </div>
            )}

            {isPassHolder ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Active member</span>
                </div>
                <Button
                  variant="gold-outline"
                  size="lg"
                  className="w-full"
                  disabled={loadingPriceId === "manage"}
                  onClick={handleManageSubscription}
                >
                  {loadingPriceId === "manage" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Manage subscription
                </Button>
              </div>
            ) : (
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                disabled={!!loadingPriceId}
                onClick={() =>
                  handleCheckout(
                    billingCycle === "monthly" ? "price_1T6rZjC1O032lUHcZiPWdPg7" : "price_1T6rawC1O032lUHcywgSq3ft",
                    "Verity Pass"
                  )
                }
              >
                {loadingPriceId?.startsWith("price_pass") ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Subscribe to Verity Pass
              </Button>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[11px] text-muted-foreground/35 mb-6 leading-relaxed"
        >
          All purchases are processed securely via Stripe.
          <br />
          Subscriptions can be cancelled at any time.
        </motion.p>
      </main>

      <BottomNav activeTab="tokens" />

      <SparkExtendModal open={extendOpen} onClose={() => setExtendOpen(false)} />
      <AnimatePresence>
        {purchaseSuccess && (
          <PurchaseSuccess item={purchaseSuccess} onDismiss={() => setPurchaseSuccess(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenShop;
