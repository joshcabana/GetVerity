

## Plan: Chemistry Replay Vault + Bundle Optimization + Console Cleanup

Three parallel workstreams. Here is what each involves.

---

### 1. Fix Remaining Console Warnings

The console shows three forwardRef warnings for `PushNotificationManager`, `Routes`, and `Landing`. The `Routes` warning is internal to react-router and cannot be fixed. The other two are actionable:

- **`PushNotificationManager`**: Wrap with `forwardRef` (same pattern as `LazyFallback`)
- **`Landing`**: This fires because `React.lazy` components receive ref validation. The fix is the same — wrap the default export with `forwardRef`

**Files:** `src/components/PushNotificationManager.tsx`, `src/pages/Landing.tsx`

---

### 2. Bundle Size Optimization

No manual chunk splitting is configured. The Agora SDK (~500KB), Framer Motion (~120KB), Recharts (~200KB), and Radix UI primitives are all bundled into a single chunk.

Add Rollup `manualChunks` to `vite.config.ts`:

```text
vendor-agora    → agora-rtc-sdk-ng
vendor-motion   → framer-motion
vendor-charts   → recharts, d3-*
vendor-radix    → @radix-ui/*
vendor-router   → react-router-dom, react-router
```

This splits the main bundle into parallelizable chunks that cache independently.

**File:** `vite.config.ts`

---

### 3. Chemistry Replay Vault

A premium feature that stores an 8-second anonymized highlight "moment" from mutual-spark calls, viewable only by Verity Pass subscribers.

#### Database

New table `chemistry_replays`:
- `id` uuid PK
- `spark_id` uuid (references sparks)
- `call_id` uuid
- `user_a` uuid, `user_b` uuid
- `video_url` text (storage path to anonymized clip)
- `duration_seconds` int default 8
- `created_at` timestamptz
- `status` text default 'processing' (processing | ready | failed)

RLS: participants can SELECT their own replays. No client INSERT/UPDATE/DELETE (server-only writes).

#### Edge Function: `generate-replay`

Triggered after a mutual spark is confirmed. In the MVP, this:
1. Validates the caller is a participant
2. Creates a `chemistry_replays` row with status `processing`
3. Returns the replay ID

The actual video processing (extracting 8s from Agora cloud recording) is a future integration point — the MVP creates the record and marks it `ready` with a placeholder. This keeps the architecture in place for when Agora Cloud Recording is configured.

#### UI: Replay Vault Tab

Add a "Vault" section to the Sparks page (or a new `/vault` route):
- Lists chemistry replays for the current user
- Each card shows partner name, timestamp, and a play button
- Non-subscribers see a blurred preview with a "Unlock with Verity Pass" CTA
- Subscribers can tap to play the 8-second clip

**Files:**
- New: `src/components/vault/ReplayCard.tsx`, `src/components/vault/ReplayVault.tsx`
- New: `supabase/functions/generate-replay/index.ts`
- Modified: `src/pages/SparkHistory.tsx` (add Vault tab)
- Modified: `src/App.tsx` (no new route needed — tab within sparks)
- Database migration: create `chemistry_replays` table + RLS

---

### Summary

| Task | Files | DB changes |
|------|-------|------------|
| Console warnings | 2 files | None |
| Bundle splitting | 1 file | None |
| Chemistry Replay Vault | 4 new + 1 modified | 1 new table |

