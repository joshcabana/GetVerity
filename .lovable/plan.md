

## Plan: Agora Cloud Recording + Console Warnings + Vault UI Verification

Three workstreams: integrate Agora Cloud Recording for real 8-second clips, fix the two remaining `forwardRef` warnings, and verify the Vault UI.

---

### 1. Fix Remaining Console Warnings

The console shows `forwardRef` warnings for **`AuthProvider`** and **`AppHeader`**. Both are rendered as direct children in `App.tsx` and receive ref validation. The `Routes` warning is internal to react-router and unfixable.

- **`src/components/AppHeader.tsx`** — wrap with `forwardRef`
- **`src/contexts/AuthContext.tsx`** — the `AuthProvider` component needs `forwardRef` wrapping

**Files:** `src/components/AppHeader.tsx`, `src/contexts/AuthContext.tsx`

---

### 2. Agora Cloud Recording Integration

Agora Cloud Recording is a server-side API that records channels. The flow:

1. **New edge function `start-cloud-recording`** — called when a live call starts, it hits the Agora Cloud Recording REST API to begin recording the channel
2. **New edge function `stop-cloud-recording`** — called when the call ends (at the "deciding" phase), stops recording and gets the file URL
3. **Modify `generate-replay`** — instead of immediately marking as "ready", it extracts the last 8 seconds from the recorded file URL and stores it

#### Architecture

```text
Call starts → start-cloud-recording → Agora records to cloud storage
Call ends   → stop-cloud-recording  → gets recording URL
Mutual spark → generate-replay      → trims to 8s, stores in chemistry_replays
```

#### Edge Function: `start-cloud-recording`
- Called from `LiveCall.tsx` when phase transitions to `"live"`
- Hits Agora Cloud Recording `acquire` then `start` REST endpoints
- Stores `resourceId` and `sid` in the `calls` table (new columns: `recording_resource_id`, `recording_sid`)
- Requires `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` (already configured), plus Agora REST API credentials (`AGORA_CUSTOMER_KEY`, `AGORA_CUSTOMER_SECRET` — new secrets needed)

#### Edge Function: `stop-cloud-recording`
- Called from `LiveCall.tsx` when the countdown ends (phase → deciding)
- Hits Agora Cloud Recording `stop` endpoint using stored `resourceId`/`sid`
- Returns the recording file URL
- Updates `calls` with `recording_url`

#### Database Changes
- Add columns to `calls`: `recording_resource_id text`, `recording_sid text`, `recording_url text`

#### Client Changes (`LiveCall.tsx`)
- When phase becomes `"live"`, invoke `start-cloud-recording`
- When countdown ends (phase → `"deciding"`), invoke `stop-cloud-recording`

#### Update `generate-replay`
- Instead of placeholder "ready", use the `recording_url` from the call to set `video_url` on the chemistry replay
- Mark as `"ready"` only if recording URL exists, otherwise `"failed"`

#### New Secrets Required
Agora Cloud Recording needs REST API credentials:
- `AGORA_CUSTOMER_KEY` — from Agora Console → RESTful API
- `AGORA_CUSTOMER_SECRET` — from Agora Console → RESTful API

These must be configured before the feature works. The edge functions will gracefully degrade (skip recording) if not set.

**Files:**
- New: `supabase/functions/start-cloud-recording/index.ts`
- New: `supabase/functions/stop-cloud-recording/index.ts`
- Modified: `supabase/functions/generate-replay/index.ts`
- Modified: `src/pages/LiveCall.tsx`
- Database migration: add 3 columns to `calls`

---

### 3. Verify Vault UI

After implementing, navigate to `/sparks` in the browser to confirm:
- Sparks/Vault tabs render correctly
- Vault empty state displays properly
- Tab switching works

---

### Summary

| Task | Files | DB changes | Secrets |
|------|-------|------------|---------|
| Console warnings | 2 files | None | None |
| Cloud Recording | 4 files (2 new edge fns) | 3 new columns on `calls` | 2 new Agora REST creds |
| Vault verification | Browser test | None | None |

