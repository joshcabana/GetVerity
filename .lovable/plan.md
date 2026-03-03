# Verity — Living Plan & Launch Checklist

*Last updated: March 3, 2026*

---

## Current State

All five development phases are complete. The platform is beta-ready for a 50–100 user pilot.

### Phases Complete
1. **Core Platform** — Auth, onboarding, lobby, Agora video calls, Spark/Pass, chat
2. **Safety & Infrastructure** — AI moderation (real LLM), admin dashboard, transparency page, appeals, blocking
3. **Payments & Premium** — Token shop, Verity Pass subscriptions, Stripe integration with idempotent webhooks
4. **Innovations** — Voice Intro, Guardian Net, Spark Reflection, Friendfluence Drops
5. **Operations & Polish** — Push notifications, stats aggregation cron, JSON-LD SEO, unread badges, 33 tests

---

## Remaining Launch Checklist

### High Priority
- [ ] Tune AI moderation thresholds with real call data from pilot Drops
- [ ] Complete trust gate enforcement (phone/selfie/pledge must fully gate Drop participation)
- [ ] Configure production secrets (Agora App ID/Certificate, Stripe keys, VAPID keys)
- [ ] Run pilot Drops with 50–100 users and monitor moderation/spark/appeal rates

### Medium Priority
- [ ] Reduce lint/type debt — replace `any` casts with typed Supabase response models
- [ ] Address bundle size warning (>2.5 MB chunk) — further code-split Agora SDK and Stripe.js
- [ ] Build Chemistry Replay Vault (8-second highlight reel, Verity Pass exclusive)
- [ ] Add granular drop scheduling (region targeting, capacity management)

### Low Priority
- [ ] Increase test coverage beyond 33 tests (add E2E tests for critical flows)
- [ ] Remove stale `bun.lockb` if present (npm is canonical)

---

## Security Posture

All edge functions enforce JWT authentication. Key security measures:

| Area | Status |
|------|--------|
| JWT auth on all 16 edge functions | ✅ |
| Stripe price-ID allowlist | ✅ |
| Origin allowlist (checkout + portal) | ✅ |
| Webhook signature verification | ✅ |
| Idempotent event processing | ✅ |
| Agora tokens with 10-min expiry + call verification | ✅ |
| Admin-role gating via `has_role` RPC | ✅ |
| RLS on all user-facing tables | ✅ |
| Error boundary at app root | ✅ |

---

## Architecture Quick Reference

- **16 edge functions** — see `supabase/functions/`
- **13 RPC functions** — see database schema
- **20+ tables** with RLS — see `src/integrations/supabase/types.ts`
- **9 test suites, 33 tests** — see `src/test/` and `supabase/functions/_shared/`
- **Canonical project ID**: `itdzdyhdkbcxbqgukzis`
