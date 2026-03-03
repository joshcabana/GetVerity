

# Rebuild Onboarding as a 3-Step Premium Wizard

## Overview

Replace the current 8-step `Onboarding.tsx` with a stunning 3-step wizard that front-loads excitement, streamlines sign-in, and defers verification to the final step. Reuses all existing Supabase auth, feature flags, phone/selfie verification, and trust persistence logic.

## Architecture

```text
Step 0: Excitement     → Step 1: Sign In       → Step 2: Verify & Go
─────────────────       ──────────────────       ──────────────────
Hero-style layout       Magic link email OTP     Safety pledge + phone/selfie
Trust bullets           Reuse SignInStep logic    Feature flag aware
"Watch demo" CTA        Auto-advance on auth     Success → Drop teaser → Lobby
45s demo simulation     
```

## Files to Create/Modify

### 1. `src/pages/Onboarding.tsx` — Full rewrite

- **3 steps** with `TOTAL_STEPS = 3`, amber progress bar at top
- SEO: `document.title = "Verity Onboarding • Real chemistry in 45 seconds"`
- Preserves `useAuth()`, `supabase.from("user_trust").upsert()`, resume logic
- `AnimatePresence mode="wait"` between steps (same pattern as current)
- Deep navy gradient background matching HeroSection aesthetic
- On completion: sets `onboarding_complete: true` and navigates to `/lobby`

### 2. `src/components/onboarding/ExcitementStep.tsx` — New file

- Full-screen hero layout mirroring `HeroSection.tsx` style
- Headline: "Real chemistry in 45 seconds." with gold gradient text
- Subtext: "No endless swiping. No rejection notifications. Just mutual spark."
- Three trust bullets in elegant cards:
  - "Anonymous until mutual spark"
  - "Nothing stored if no connection"  
  - "Verified 18+ members only"
- Amber "Watch 45-second demo" button → triggers a simulated 45-second countdown overlay with pulsing anonymous silhouette animation (no actual Agora call — a simulated demo experience using Framer Motion)
- After demo: "Anonymous until mutual spark" reveal animation, then "Continue" button
- Uses existing `Button` (variant="gold"), `motion` animations, Lucide icons

### 3. `src/components/onboarding/MagicLinkStep.tsx` — New file

- Headline: "One email. Instant magic."
- Clean email input with `Mail` icon (reuses exact `Input` + `Button` from `SignInStep`)
- Calls `supabase.auth.signInWithOtp({ email })` — same logic as existing `SignInStep`
- OTP entry with mono-spaced 6-digit input
- On verify success: sparkle animation "✨ Magic link verified!", auto-advance after 1.5s
- "Use a different email" fallback link
- Privacy note: "We never share your email. Ever."

### 4. `src/components/onboarding/VerifyStep.tsx` — New file

- Headline: "Last step: Verify once" with subtext "Takes 12 seconds. Never asked again."
- Combines safety pledge (checkbox from `SafetyPledgeStep`) + phone verification (from `PhoneVerifyStep`, respecting `requirePhoneVerification` flag) + selfie (from `SelfieStep`)
- Accordion/sequential sub-steps within one view:
  1. Safety pledge checkbox (always required)
  2. Phone verification (conditional on feature flag, reuses `PhoneVerifyStep` logic inline)
  3. Selfie verification (optional skip, reuses `SelfieStep` capture logic)
- Privacy text: "AU Privacy Act compliant • Encrypted & deleted after check"
- On all complete: success state with confetti-like sparkle animation
  - "✅ Verified • You're in the next Drop!"
  - Live teaser card: "Next Drop: Tonight 8pm • Tech Professionals" (fetches from `drops` table like `DropReadyStep`)
  - Gold button → navigate to `/lobby`

### 5. No changes to

- `ProtectedRoute.tsx` — already checks `onboarding_complete` and trust fields
- `AuthContext.tsx` — `userTrust` shape unchanged
- `user_trust` table — same columns used (`onboarding_step`, `onboarding_complete`, `safety_pledge_accepted`, `phone_verified`, `selfie_verified`)
- Any edge functions or RLS policies
- Existing onboarding sub-components remain in codebase (not deleted, just unused by new wizard)

## Key Design Decisions

- **No actual Agora demo call** — simulating a 45-second demo with Framer Motion countdown + silhouette animation is far more reliable and doesn't require token generation for unauthenticated users
- **Magic link OTP (not password)** — matches the existing `SignInStep` flow exactly, keeps onboarding passwordless
- **VerifyStep combines 3 sub-tasks** in one step to feel fast while still collecting all trust fields that `ProtectedRoute` checks
- **Mobile-first** — all max-w-sm containers, touch-friendly targets, safe-area padding
- **Zero new dependencies** — only uses framer-motion, lucide-react, shadcn components, and Supabase client already installed

