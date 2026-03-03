# Verity — Anonymous Speed Dating Platform

## Project Overview

**Verity** is a verified, anonymous speed dating platform designed to solve the burnout epidemic in modern dating apps. The swipe economy is broken — 78% of dating-app users experience burnout, 80% of women report dating fatigue, and ghosting accounts for 41% of that fatigue. Verity's answer is radical: real eyes, real voice, 45 seconds, and dignity always.

**Core mechanic:** Users RSVP to themed, time-limited "Drops" (scheduled speed dating sessions). When a Drop goes live, participants are matched anonymously for a 45-second video call. Both choose Spark or Pass independently. Only a **mutual spark** reveals identities and unlocks post-call chat — no rejection notifications, ever.
**Project overview**: See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for a detailed examination of objectives, strategy, timelines, and current status.

---

## Primary Objectives

| # | Objective | Outcome |
|---|-----------|---------|
| 1 | **Authentic first impressions** | Replace profile-photo bias with live voice and video — real chemistry in 45 seconds |
| 2 | **Zero ghosting by design** | Mutual-spark gate means no unrequited contact; no rejection signals sent |
| 3 | **Safety first** | Live safety checks (metadata + transcript snippets where available), identity verification (phone + selfie), safety pledge, and user blocking |
| 4 | **Privacy by default** | Anonymous until mutual spark; raw call video is not stored |
| 5 | **Radical transparency** | Public safety stats, moderation rates, and gender-balance metrics published in real time |
| 6 | **Intention over addiction** | No infinite scroll, no streaks, no dopamine loops — Verity is used, not consumed |

---

## Strategic Plan & Milestones

### Phase 1 — Core Platform ✅ Complete
- User authentication (email/password via Supabase Auth)
- Onboarding flow with identity verification (phone + selfie + safety pledge)
- Lobby with upcoming/live Drops, RSVP management, and real-time updates
- Anonymous video calls via Agora RTC (45-second sessions)
- Mutual-spark decision mechanic with post-call chat unlock
- Spark history and chat inbox

### Phase 2 — Safety & Infrastructure ✅ Complete
- AI moderation function (`ai-moderate`) gated behind call participation check
- Matchmaking queue with Drop-scoped unique constraint
- User blocking (`user_blocks` table with RLS policies)
- Selfie verification storage bucket with per-user access controls
- Admin dashboard: moderation queue, appeals inbox, analytics, user management
- Transparency page: live safety stats, founding principles, gender balance chart
- Appeal submission flow for moderation decisions

### Phase 3 — Payments & Premium ✅ Complete
- Token shop with Stripe Checkout (starter, popular, value packs)
- Verity Pass subscription (monthly and annual tiers)
- Stripe Customer Portal for subscription management
- Stripe webhook handler with idempotency and customer-ID mapping
- Token balance and transaction history tracking

### Phase 4 — Innovations ✅ Complete
- **Friendfluence Drops** — Invite a friend to the same Drop for shared courage (UI + invite link generation live at `/drops/friendfluence`)
- **Spark Reflection** — Private post-call AI insight (tone/energy analysis via Lovable AI Gateway)
- **Verity Voice Intro** — Optional 15-second voice note before text chat unlocks after mutual spark
- **Guardian Net** — One-tap safe-call signal to a trusted friend (server-side alert logging to `guardian_alerts`)

### Phase 5 — Operations & Polish ✅ Complete
- Push notifications for RSVP reminders and new Spark matches (Web Push via VAPID keys)
- Automated platform stats aggregation (`aggregate-stats` edge function)
- JSON-LD structured data on landing page for SEO
- Unread message count badge on Sparks tab in bottom navigation
- 9 test suites with 33 passing tests (auth, feature flags, routing, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity)
- Production polish: forwardRef warning fixes, error boundaries, lazy loading

---

## Current Progress

### Completed ✅
- Full frontend (React + Vite + TypeScript + shadcn-ui + Tailwind CSS)
- All core pages: Landing, Auth, Onboarding, Lobby, Live Call, Spark History, Chat, Token Shop, Admin, Transparency, Appeal, Profile, Friendfluence
- Supabase backend: auth, profiles, drops, calls, sparks, messages, matchmaking queue, token transactions
- 16 edge functions deployed (matchmaking, video auth, AI moderation, payments, appeals, admin, push notifications, stats aggregation, feature flags, VAPID key generation, friend invites, demo tokens)
- 13 RPC functions (`claim_match_candidate`, `get_drop_rsvp_count`, `has_role`, `is_spark_member`, `submit_call_decision`, `update_my_profile`, `shares_spark_with`, `get_spark_partner_profile`, `check_mutual_spark`, `notify_new_message`, `notify_new_spark`, `handle_new_user`, `update_updated_at_column`)
- Agora real-token generation with 10-minute expiry (using `agora-token` npm package)
- Security hardening: auth on all edge functions, price-ID allowlist, origin allowlist, idempotent webhooks
- Realtime subscriptions for drops, RSVPs, calls, and messages
- Friendfluence Drops page (invite link generation + themed drop UI at `/drops/friendfluence`)
- Voice Intro recording and playback via Supabase Storage signed URLs
- Guardian Net server-side alert logging with RLS
- Spark Reflection AI insights surfaced on spark cards
- Push notifications system (VAPID keys, service worker, subscription management)
- Platform stats aggregation cron (automated daily via `aggregate-stats`)
- JSON-LD structured data on landing page
- Unread message count badge on Sparks tab
- 9 test suites, 33 passing tests (auth capabilities, feature flags, route guarding, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity, URL validation)
- Production polish: forwardRef warning fixes across all landing components

### In Progress 🔄
- Tuning AI moderation thresholds and browser transcript coverage fallbacks
- Chemistry Replay Vault (8-second anonymized highlight reel, Verity Pass gated)

### Upcoming 📋
- Chemistry Replay Vault (Verity Pass gated)
- Granular drop scheduling (region targeting, capacity management)

---

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| **Payment security** — `create-checkout` accepted arbitrary `customer_email` and `success_url` from clients, enabling fraud and open-redirect attacks | Rewrote to authenticate the caller's JWT, derive email from the verified session, build redirect URLs server-side from an origin allowlist, and validate `price_id` against a hardcoded map |
| **Stripe webhook idempotency** — duplicate webhook deliveries could credit tokens or subscriptions multiple times | Added `stripe_processed_events` table (primary key on `event_id`); duplicate events return `{ received: true }` immediately |
| **Agora stub tokens** — early implementation returned placeholder tokens, breaking real calls | Replaced with `RtcTokenBuilder.buildTokenWithUid` (10-minute expiry); call-participation verified server-side before token is issued |
| **Open redirect in customer portal** — `return_url` was accepted verbatim from client, enabling redirect to arbitrary sites | Replaced with strict URL parsing + exact-origin allowlist validation; falls back to `/tokens` when invalid |
| **forwardRef console warnings** — React internals attaching refs to lazy-loaded function components caused noisy console warnings | Wrapped all landing components with `React.forwardRef` and added `.displayName` |
| **Test coverage gap** — Only 1 placeholder test existed at launch | Resolved: 9 test suites with 33 passing tests covering auth, feature flags, routing, components, and edge function logic |
| **Stats population** — Transparency and Admin pages showed zero values | Resolved: `aggregate-stats` edge function deployed as automated cron job |
| **AI moderation stub** — Random-score stub replaced with real LLM (Gemini 2.5 Flash Lite) with structured tool-use and policy-based risk scoring | Now wired into live calls; threshold tuning in progress |

---

## Adjustments to Original Plans

1. **AI moderation timeline shifted** — Transcript-assisted moderation is now wired in the live call flow (with browser fallback behavior) and is being tuned before pilot launch.
2. **Security hardening promoted to Phase 2** — Originally planned for a later hardening sprint; vulnerabilities found in payment flows were addressed immediately before any public launch.
3. **Customer ID mapping added to webhook** — Original plan used email-only lookup; Stripe email can change, so `stripe_customer_id` is now stored on `user_payment_info` for deterministic lookup.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, shadcn-ui, Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage) |
| Video | Agora RTC SDK |
| Payments | Stripe (Checkout, Billing Portal, Webhooks) |
| AI | Lovable AI Gateway (Gemini 2.5 Flash Lite) |
| Testing | Vitest, Testing Library |

---

## Development

Package manager policy: `npm` is the canonical toolchain for local dev and CI.

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```

### Auth Provider Policy

- Canonical Cloud project: `itdzdyhdkbcxbqgukzis`
- Runtime policy source: `public.app_config` row `key='auth_policy'`
- Phone verification mode: `value_json.require_phone_verification` (served via `get-feature-flags`)
- Optional Google login enforcement: `VITE_REQUIRE_GOOGLE_AUTH=true`
