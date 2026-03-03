

## Full Project Alignment Plan

### Summary of Drift

After cross-referencing `README.md`, `PROJECT_OVERVIEW.md`, `.lovable/plan.md`, the codebase, and project memory, significant documentation drift exists. The code is ahead of the docs in most areas. Here is the plan to bring everything into sync.

---

### 1. Update README.md

The README is the most out-of-date file. Changes needed:

**Phase 4 status**: Change from "Partial" to "Complete". Voice Intro, Guardian Net, Spark Reflection, and Friendfluence are all implemented.

**Add Phase 5 — Operations & Polish** (new): Push notifications, platform stats automation, JSON-LD SEO, unread count badge — all recently shipped.

**Edge functions count**: Update from 10 to 16 (add `agora-demo-token`, `generate-friend-invite`, `send-push`, `get-feature-flags`, `aggregate-stats`, `generate-vapid-keys`).

**"Completed" section**: Add Voice Intro, Guardian Net, Spark Reflection, push notifications, platform stats aggregation cron, JSON-LD structured data, unread count badge on Sparks tab, 33 passing unit tests, Friendfluence page with invite link generation and activity ticker.

**"In Progress" section**: Replace current items with accurate list — only AI moderation threshold tuning and Chemistry Replay Vault remain.

**"Upcoming" section**: Remove push notifications (done). Keep Chemistry Replay Vault only.

**Canonical Supabase project ID**: Change `lixgbpgemcpdbjzhjknf` to `itdzdyhdkbcxbqgukzis` (the actual Cloud project).

**Remove dead docs/ references**: The `docs/` directory doesn't exist. Remove references to `docs/environment-matrix.md` and `docs/auth-unblock-runbook.md`, or inline the relevant content.

**RPC functions**: Update from 4 to 13 (add `submit_call_decision`, `update_my_profile`, `shares_spark_with`, `get_spark_partner_profile`, `check_mutual_spark`, `notify_new_message`, `notify_new_spark`, `handle_new_user`, `update_updated_at_column`).

**Test coverage**: Update from "1 placeholder test" to "9 test suites, 33 passing tests" covering auth capabilities, feature flags, route guarding, Guardian Net, Voice Intro, moderation wiring, matchmaking atomicity.

**Challenges table**: Mark "Stats population" as resolved (aggregate-stats cron deployed). Add resolution note for test coverage (no longer critical — 33 tests passing).

---

### 2. Update PROJECT_OVERVIEW.md

**Header note**: Update date to March 3, 2026. Change "point-in-time assessment from February 27" to current date.

**Remove stale docs/ references**: `docs/environment-matrix.md` and `docs/evidence-pack-final-2026-03-02.md` don't exist.

**§2.3 Edge Functions**: Update from 10 to 16. Add missing functions to the table.

**§2.4 Phase 4**: Already marked Complete — correct.

**§3.1 Completed**: Add push notifications system, platform stats automation, JSON-LD SEO, unread message badges, 9 test suites with 33 tests.

**§3.2 In Progress**: Remove "Observability" (stats aggregation is now deployed). Keep only AI moderation threshold tuning.

**§3.3 Upcoming**: Remove items that are done (push notifications, Spark Reflection, Voice Intro, Guardian Net, Friendfluence). Keep only Chemistry Replay Vault and granular drop scheduling.

**§4 Challenges**: Mark "Test coverage gap" as resolved (33 tests). Mark "Stats population" as resolved. Update "AI moderation live wiring" — it IS wired now, just being tuned.

**§6 Development Metrics**: Update edge functions to 16, RPC functions to 13, test suites to 9.

**§7 Progress Validation**: Update `npm run test` to "33 tests passing across 9 suites".

---

### 3. Update .lovable/plan.md

Replace the stale VoiceIntroBanner plan with a current security/architecture summary that serves as a living plan document, noting remaining launch checklist items.

---

### 4. Code-level fixes (minor)

No code changes are needed for alignment — the code is ahead of the docs. The docs will be updated to match the code.

---

### Estimated scope

3 files modified: `README.md`, `PROJECT_OVERVIEW.md`, `.lovable/plan.md`. No code changes, no migrations, no edge function changes.

