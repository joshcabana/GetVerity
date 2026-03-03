# Verity — Comprehensive Project Examination

*Last updated: March 3, 2026*

> **Beta-Ready** — All five phases complete. Voice Intro, Guardian Net, Spark Reflection, push notifications, and platform stats automation are all wired end-to-end. Ready for 50–100 user pilot.

---

## 1. Primary Objectives & Intended Outcomes

Verity is a verified, safety-first speed-dating platform built around 45-second anonymous video "Drops" and a mutual Spark/Pass reveal model. The project pursues six core objectives:

1. **Authentic first impressions** — Replace swipe-based profile browsing with live 45-second video calls that surface real voice, eye contact, and presence.
2. **Zero ghosting by design** — The mutual-spark gate means identities are revealed only when both participants choose "Spark." A "Pass" is silent and private, eliminating rejection exposure.
3. **Safety-first architecture** — Real-time AI moderation during calls, server-verified identity gates (phone, selfie, safety pledge), and one-tap Safe Exit and Guardian Net for immediate protection.
4. **Privacy by default** — Participants are anonymous during the 45-second call. Personal information is withheld until mutual consent.
5. **Radical transparency** — A public Transparency page exposes platform safety statistics, moderation accuracy, appeals outcomes, and founding principles.
6. **Intention over addiction** — Scheduled Drops replace infinite scroll. No dopamine loops, no dark-pattern engagement mechanics. Revenue comes from token packs and Verity Pass subscriptions.

---

## 2. Strategic Plans & Methodologies

### 2.1 Architecture & Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + TypeScript | 14 pages, 91+ components across 8 directories, lazy-loaded heavy routes |
| **UI** | shadcn/ui + Tailwind CSS + Framer Motion | Responsive design with motion transitions; Sonner for toast notifications |
| **State** | React Query + AuthContext + Supabase Realtime | Server cache via TanStack Query; global auth/trust/admin state in context; live subscriptions for drops, messages, and queue |
| **Backend** | Supabase (PostgreSQL + RLS) | 20 tables, 6 custom enums, 13 RPC functions, row-level security policies |
| **Edge Functions** | 16 Deno functions on Supabase | Matchmaking, video auth, AI moderation, payments, appeals, admin moderation, push notifications, stats aggregation, feature flags, VAPID keys, friend invites, demo tokens |
| **Video** | Agora RTC SDK | 45-second sessions with server-issued tokens (10-minute expiry), call participation verified server-side |
| **Payments** | Stripe | Checkout Sessions, Billing Portal, Webhooks with idempotency via `stripe_processed_events` |
| **AI Moderation** | Lovable AI Gateway (Gemini 2.5 Flash Lite) | Tool-use based structured risk scoring with policy-driven violation detection |
| **Deployment** | Lovable.app + Supabase Cloud | Frontend hosted on Lovable; backend on Supabase managed infrastructure |

### 2.2 Database Schema (20 Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles: display name, avatar, age, city, gender, bio, token balance, subscription tier |
| `user_trust` | Onboarding verification state: phone verified, selfie verified, safety pledge, DOB, preferences, onboarding step/completion |
| `user_roles` | Role-based access: `admin`, `moderator`, `user` |
| `user_blocks` | Bidirectional user blocking for matchmaking exclusion |
| `user_payment_info` | Stripe customer ID mapping for deterministic payment lookups |
| `rooms` | Themed rooms with categories, descriptions, icons, gender balance tracking, premium flags |
| `drops` | Scheduled speed-dating events: title, region, timezone, capacity, duration, Friendfluence flag |
| `drop_rsvps` | User RSVPs for drops with check-in status and friend invite codes |
| `matchmaking_queue` | Atomic queue entries: user/room/drop, status tracking, matched call reference |
| `calls` | Video call records: caller/callee, Agora channel, start/end times, duration, Spark/Pass decisions, mutual spark flag |
| `sparks` | Mutual spark connections: linked call, AI insight, voice intro URLs, expiry, archive status |
| `messages` | Post-spark chat: text and voice messages with read receipts |
| `moderation_flags` | AI and human moderation flags: flagged user, call, reason, AI confidence, clip URL, action taken |
| `moderation_events` | Detailed moderation event log: call, risk score, action, metadata |
| `appeals` | User appeals against moderation decisions: explanation, voice note, admin response, status |
| `reports` | User-submitted reports: reason, reported user, call, buffer URL, review status |
| `token_transactions` | Token credit/debit ledger: amount, reason, Stripe session reference |
| `stripe_processed_events` | Webhook idempotency table: prevents duplicate processing of Stripe events |
| `platform_stats` | Aggregated platform metrics: active users, total calls/sparks, moderation stats, gender balance |
| `runtime_alert_events` | System-level alert log: level, message, metadata |
| `push_subscriptions` | Web push notification subscriptions: endpoint, keys |
| `guardian_alerts` | Guardian Net safe-call signals logged during live calls |
| `app_config` | Runtime configuration (auth policy, feature flags) |

### 2.3 Edge Functions (16)

| Function | Responsibility |
|----------|---------------|
| `find-match` | Atomic matchmaking: joins queue, finds waiting partner (excluding blocked users), creates call record, returns call ID |
| `agora-token` | Issues Agora RTC tokens with 10-minute expiry after verifying user is a participant in the requested call |
| `agora-demo-token` | Issues demo Agora tokens for development/testing without call-participation checks |
| `ai-moderate` | Analyzes call transcripts/metadata via LLM (Gemini 2.5 Flash Lite) with tool-use; returns structured risk score, violation flag, and reason |
| `create-checkout` | Creates Stripe Checkout sessions; validates JWT auth, origin allowlist, and price-ID allowlist; maps to payment or subscription mode |
| `stripe-webhook` | Processes Stripe events (`checkout.session.completed`, `customer.subscription.deleted`); idempotent via `stripe_processed_events`; credits tokens or updates subscription tier |
| `customer-portal` | Creates Stripe Billing Portal sessions for subscription management; validates return URL against origin allowlist |
| `check-subscription` | Verifies user's current subscription status against Stripe |
| `spark-extend` | Extends spark connection expiry window |
| `submit-appeal` | Processes user appeals against moderation flags with optional voice notes |
| `admin-moderation` | Admin-only endpoint for reviewing flags and taking moderation actions (ban/warn/clear) |
| `generate-friend-invite` | Generates unique invite codes for Friendfluence Drops |
| `send-push` | Sends Web Push notifications to subscribed users (new sparks, RSVP reminders) |
| `generate-vapid-keys` | Generates VAPID key pairs for Web Push notification setup |
| `get-feature-flags` | Returns runtime feature flags from `app_config` (phone verification mode, etc.) |
| `aggregate-stats` | Aggregates platform metrics into `platform_stats` table (scheduled cron job) |

### 2.4 Phased Timeline

| Phase | Status | Scope |
|-------|--------|-------|
| **Phase 1 — Core Platform** | Complete | Auth, 8-step onboarding, lobby/drops, Agora video calls, 45s timer, Spark/Pass mechanic, mutual-spark reveal, spark history, post-match chat |
| **Phase 2 — Safety & Infrastructure** | Complete | AI moderation wired to real LLM with live-call transcript fallback, matchmaking queue with block filtering, selfie verification, admin dashboard (moderation queue + appeals inbox + analytics), transparency page, appeals flow, security hardening, Profile page |
| **Phase 3 — Payments & Premium** | Complete | Token shop with 3 packs (10/15/30 tokens), Verity Pass subscriptions (monthly/annual), Stripe Checkout + Customer Portal + Webhook handler with idempotency and customer-ID mapping |
| **Phase 4 — Innovations** | Complete | Voice Intro (record during call, replay in chat via signed URLs), Guardian Net (server-side alert logging to `guardian_alerts`), Spark Reflection AI insight, Friendfluence Drops with invite links |
| **Phase 5 — Operations & Polish** | Complete | Push notifications, automated platform stats aggregation, JSON-LD SEO, unread message badges, 33 passing tests across 9 suites |

### 2.5 Sprint Schedule (relative to Feb 27, 2026)

| Sprint | Dates | Focus |
|--------|-------|-------|
| **Current** | Feb 24 – Mar 7 | Harden trust gates (phone/selfie/pledge enforcement in `AuthContext` + onboarding), stabilize drop RSVP + matchmaking queue (`find-match`), ensure Agora token issuance flow works end-to-end in LiveCall |
| **Next** | Mar 8 – Mar 21 | Tune AI moderation thresholds, wire reporting → appeals dashboard, validate Guardian Net + Safe Exit in live calls |
| **Pilot & Telemetry** | Mar 22 – Apr 4 | Run limited Drops with real users, track spark conversion/appeals/moderation rates, surface live metrics on Transparency and Admin pages |
| **Monetization Hardening** | Apr 5 – Apr 18 | Finalize token shop pricing guardrails, verify subscription lifecycle via `stripe-webhook`, add retention hooks (Spark History → Chat → Voice Intro flow) |

---

## 3. Current Progress & Status

### 3.1 Completed

**Frontend (14 pages, fully implemented):**
- **Landing** — Marketing narrative with Hero, Stats counter, Features grid, Innovations showcase, safety/privacy positioning, and JSON-LD structured data
- **Auth** — Supabase email/password authentication with redirect handling
- **Onboarding** — 8-step progressive flow: welcome → age verification → phone → selfie → safety pledge → preferences → profile setup → completion (each step updates `user_trust`)
- **Lobby** — Drop discovery with search/filter, RSVP management, realtime participant counts, matchmaking queue entry via `find-match`
- **LiveCall** — 45-second anonymous video via Agora, countdown timer, Spark/Pass decision capture, mutual-spark reveal with confetti animation, Guardian Net alert, Safe Exit, and in-call reporting
- **SparkHistory** — List of mutual sparks with partner info, AI insights, unread message badges, and navigation to chat
- **Chat** — Real-time text and voice messaging with read receipts via Supabase Realtime, Voice Intro banner
- **TokenShop** — 3 token packs + 2 subscription tiers (monthly/annual), integrated with Stripe Checkout, purchase success handling
- **Profile** — Avatar upload to Supabase Storage, editable display name, verification badges (phone/selfie/pledge), token balance display, subscription management via Customer Portal, sign-out
- **Admin** — Moderation queue with flag review (ban/warn/clear), appeals inbox with admin response, analytics dashboard, user management (admin-role gated)
- **Transparency** — Founding principles, safety statistics (live from `platform_stats`), moderation accuracy rates, appeals outcomes
- **Appeal** — User-facing appeal submission with explanation and optional voice note upload
- **Friendfluence** — Invite friends to Drops with generated invite links and activity ticker

**Backend (16 edge functions, 13 RPC functions):**
- All 16 edge functions deployed and functional with JWT authentication
- Atomic matchmaking with block-list filtering (`find-match`)
- Agora token issuance with server-side call participation verification (`agora-token`)
- AI moderation via real LLM (Lovable AI Gateway / Gemini 2.5 Flash Lite) with structured tool-use and policy-based risk scoring (`ai-moderate`)
- Stripe payment flow: checkout creation with price-ID allowlist, webhook processing with idempotency, customer portal with origin-validated return URLs
- Admin moderation actions persisted to `moderation_flags` with audit trail
- Push notification system: VAPID key generation, subscription management, notification dispatch
- Automated platform stats aggregation via `aggregate-stats` cron
- Feature flag system via `get-feature-flags` for runtime configuration

**Security hardening:**
- JWT authentication enforced on all edge functions
- Price-ID allowlist in `create-checkout` prevents arbitrary Stripe price injection
- Origin allowlist on `create-checkout` and `customer-portal` prevents open redirect attacks
- Webhook signature verification with `stripe.webhooks.constructEventAsync`
- Idempotent event processing via `stripe_processed_events` table (PK on `event_id`)
- Customer-ID mapping for deterministic Stripe lookups (replaces email-based approach)
- Agora tokens issued with 10-minute expiry and call-participation verification
- Protected routes with admin-role gating via `has_role` RPC function
- Error boundary wrapping the application root

**Testing (9 suites, 33 tests):**
- Auth capabilities and feature flag parsing
- Route guarding and protected route behavior
- Guardian Net component and Voice Intro banner
- Live call moderation wiring
- Matchmaking atomicity
- URL validation for edge functions

**Performance:**
- Lazy loading for 8 heavy routes: LiveCall, SparkHistory, Chat, TokenShop, Admin, Transparency, Appeal, Profile
- Code splitting via React.lazy + Suspense with loading spinner fallback

### 3.2 In Progress

- **AI moderation threshold tuning** — The `ai-moderate` function is invoked from active calls with transcript snippets where browser speech APIs are available. Current focus is threshold tuning and fallback quality.
- **Trust gate enforcement** — Phone/selfie/safety-pledge verification signals are checked in lobby matchmaking but require complete onboarding flow to properly gate Drop participation.

### 3.3 Upcoming

- **Chemistry Replay Vault** — 8-second anonymized highlight reel from mutual-spark calls (Verity Pass exclusive)
- **Granular drop scheduling** — More control over drop timing, region targeting, and capacity management

---

## 4. Challenges & Mitigations

### Active Challenges

| Challenge | Severity | Details | Mitigation |
|-----------|----------|---------|-----------|
| **AI moderation threshold tuning** | Moderate | `ai-moderate` function is wired into live calls but thresholds need calibration with real user data. | Run pilot Drops to collect moderation events and tune risk-score thresholds based on actual call patterns. |
| **Lint/type debt** | Moderate | `npm run lint` fails on `any` usage across onboarding, lobby, and live-call components, plus Fast Refresh warnings for non-component exports. | Add typed Supabase response models to replace `any` casts. Move shared constants and helper functions out of component files into dedicated modules. |
| **Bundle size** | Moderate | Vite build emits a >2.5 MB chunk warning. | Lazy loading for 8 routes partially addresses this. Further code splitting of heavy dependencies (Agora SDK, Stripe.js) and tree-shaking review needed. |
| **Environment secrets** | Operational | Agora App ID/Certificate, Stripe Secret Key/Webhook Secret, Supabase URL/Keys, and Lovable API Key are mandatory for call and payment flows. | Document required environment variables. Ensure deployment secrets are configured per environment (dev/staging/production) before pilots. |

### Resolved Challenges

| Challenge | Resolution |
|-----------|-----------|
| **AI moderation stub** | Upgraded from `Math.random()` score to real LLM call (Gemini 2.5 Flash Lite via Lovable AI Gateway) with structured tool-use and policy-based violation detection. |
| **Payment security** | `create-checkout` now enforces JWT authentication, derives user email from session, validates request origin against an allowlist, and checks price-ID against a hardcoded map. |
| **Webhook idempotency** | Added `stripe_processed_events` table with primary key on `event_id` to prevent duplicate token credits or subscription updates. |
| **Agora token security** | Replaced client-side stubs with `RtcTokenBuilder.buildTokenWithUid` on the server, issuing tokens with 10-minute expiry only after verifying the requesting user is a participant in the call. |
| **Open redirect risk** | Customer portal `return_url` is validated via strict URL parsing + exact origin allowlist before creating Stripe Billing Portal sessions. |
| **Bundle performance** | Added lazy loading via `React.lazy` + `Suspense` for 8 heavy routes (LiveCall, Admin, TokenShop, SparkHistory, Chat, Transparency, Appeal, Profile). |
| **Test coverage gap** | Resolved: 9 test suites with 33 passing tests covering auth capabilities, feature flags, route guarding, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity, and URL validation. |
| **Stats population** | Resolved: `aggregate-stats` edge function deployed as automated cron; Transparency and Admin pages now read live data from `platform_stats`. |

---

## 5. Adjustments to Original Plans

1. **AI moderation accelerated** — Upgraded from a random-score stub to a real LLM with tool-use ahead of the original "Next sprint" timeline. Now wired into live calls; threshold tuning is the remaining work.
2. **Security hardening promoted** — Originally planned for later phases, payment and token-issuance security vulnerabilities were identified and addressed immediately in Phase 2.
3. **Profile page added** — Not in the original plan; added to Phase 2 scope to provide users with account management, verification status visibility, and subscription controls.
4. **Customer-ID mapping** — The Stripe webhook originally used email-based customer lookups. Updated to use `stripe_customer_id` stored on `user_payment_info` for deterministic, reliable mapping.
5. **Lazy loading introduced** — Added code splitting for 8 routes in `App.tsx` to address the >2.5 MB bundle warning and improve initial page load performance.
6. **Transparency and appeals prioritized** — Built governance surfaces (Transparency page, Admin appeals inbox, `submit-appeal` function) before GA to establish trust infrastructure early.
7. **Trust gates as prerequisite** — Gated live Drop participation behind multi-step verification (phone, selfie, safety pledge) to reduce fraud and bad actors during the pilot phase.
8. **Phase 5 added** — Operations & Polish phase was not in the original plan; added to cover push notifications, stats automation, SEO, and test coverage.

---

## 6. Development Metrics

| Metric | Value |
|--------|-------|
| Frontend pages | 14 |
| UI components | 91+ across 8 directories |
| Edge functions | 16 |
| Database tables | 20+ |
| Custom enums | 6 (`app_role`, `appeal_status`, `call_status`, `moderation_action`, `spark_decision`, `subscription_tier`) |
| RPC functions | 13 (`claim_match_candidate`, `get_drop_rsvp_count`, `has_role`, `is_spark_member`, `submit_call_decision`, `update_my_profile`, `shares_spark_with`, `get_spark_partner_profile`, `check_mutual_spark`, `notify_new_message`, `notify_new_spark`, `handle_new_user`, `update_updated_at_column`) |
| Test suites | 9 (33 passing tests) |
| Deployment target | Lovable.app (frontend) + Supabase Cloud (backend) |

---

## 7. Progress Validation

| Check | Status | Notes |
|-------|--------|-------|
| `npm run test` | Passes | 33 tests passing across 9 suites (auth capabilities, feature flags, route guarding, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity, URL validation) |
| `npm run build` | Passes | Vite production build succeeds with bundle-size warnings (>2.5 MB chunk) |
| `npm run lint` | Fails | Pre-existing TypeScript `any` usage and Fast Refresh warnings; no regressions from recent changes |
