

## Recommendation: Option 1 (Raw Path Storage)

Option 1 is the correct choice. The critical difference is in requirement #3:

- **Option 1**: Store the **raw storage path** in `voice_intro_a`/`voice_intro_b`, generate signed URLs at render time. This is architecturally sound — signed URLs expire (default 60min), so storing them would break historical playback.
- **Option 2**: Store the **signed URL** directly. This will silently break after expiry, causing dead audio links across the app.

Everything else between the two prompts is functionally identical. Option 1 also has slightly cleaner guardrails language.

---

## Plan: Wire VoiceIntro.tsx with Production Logic

### Current State Confirmed
- `VoiceIntro.tsx` exists with 5 phases: `intro → recording → recorded → listening → done`
- Uses `setTimeout` simulation for listening→done transition
- No real MediaRecorder, no storage, no DB sync
- `sparks` table already has `voice_intro_a` and `voice_intro_b` text columns

### Changes

**1. Migration: `20260304_voice_intros_bucket.sql`**
- Create `voice-intros` private storage bucket
- RLS: authenticated INSERT to own `user_id/` prefix
- RLS: SELECT for spark participants (using `is_spark_member` pattern)

**2. Update `VoiceIntro.tsx` (logic only, zero UI changes)**

New props needed: `sparkId: string` (to know which spark row to update)

Wire in:
- **MediaRecorder API** with 15s hard limit via `timeslice` + `ondataavailable` collecting chunks, `onstop` creating Blob
- **Self-playback** in "recorded" phase: `URL.createObjectURL(blob)` → `HTMLAudioElement` play/pause toggle on existing Play/Square button
- **Send**: upload to `voice-intros/${user.id}/${sparkId}/${Date.now()}.webm`, store **raw path** in correct column (`voice_intro_a` if user is `user_a`, else `voice_intro_b`)
- **Listening phase**: Supabase Realtime subscription on `sparks` table filtered by spark `id`; transition to "done" when both columns are non-null strings
- **Skip**: write `"skipped"` to the user's column, check if partner column is also populated → if so, go to "done" immediately

**3. Update `LiveCall.tsx`** (minimal — pass `sparkId` prop to `VoiceIntro`)

### Files Modified
| File | Change |
|------|--------|
| New migration SQL | Storage bucket + RLS policies |
| `src/components/call/VoiceIntro.tsx` | Wire real recording, playback, upload, realtime sync |
| `src/pages/LiveCall.tsx` | Pass `sparkId` prop to VoiceIntro |

