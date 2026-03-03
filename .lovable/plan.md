

# Friendfluence Drops Feature

## Overview

Create a dedicated Friendfluence page at `/drops/friendfluence` with invite link generation, realtime activity ticker, and friend invite form. Add a trigger button in onboarding Step 3 (VerifyStep "done" sub-step). Create a new edge function for generating friend invite codes.

## Architecture

```text
VerifyStep "done" → "Bring a Friend" button → /drops/friendfluence
                                                  ↓
                                          Friendfluence.tsx
                                          ├── Hero section
                                          ├── Invite form (email/phone)
                                          ├── Shareable magic link (edge fn)
                                          ├── Live ticker (Supabase realtime on drop_rsvps)
                                          └── Reward preview card
```

## Files to Create/Modify

### 1. NEW: `supabase/functions/generate-friend-invite/index.ts`

Edge function (authenticated) that:
- Accepts `{ drop_id }` in body
- Generates a unique `friend_invite_code` (nanoid-style, 8 chars using crypto)
- Upserts into `drop_rsvps` with the code (user must be RSVP'd or auto-RSVPs them)
- Returns `{ invite_url, code }` where URL is `https://getverity.com.au/drops/friendfluence?code=XXX&drop=YYY`

Uses existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. No new secrets needed.

### 2. NEW: `src/pages/Friendfluence.tsx`

Full page with sections:
- **Hero**: "Bring a Friend · Get 2× Chemistry Score" with Shield icon, navy/amber branding
- **Invite form**: Email input (or phone if `requirePhoneVerification` flag active), sends invite via clipboard share link (no email service needed — generates shareable URL)
- **Live ticker**: Realtime subscription on `drop_rsvps` table filtered by friendfluence drops, showing "X friends just joined [Drop Title]" with Framer Motion enter animations
- **Reward preview card**: "Mutual Spark = both get Verity Pass credit" with sparkle icon
- **Share button**: Calls `generate-friend-invite` edge function, copies magic link to clipboard
- Mobile-first layout matching onboarding aesthetic (max-w-sm, font-serif headings, trust bullets)

### 3. MODIFY: `src/App.tsx`

Add lazy route: `<Route path="/drops/friendfluence" element={<ProtectedRoute><Friendfluence /></ProtectedRoute>} />`

### 4. MODIFY: `src/components/onboarding/VerifyStep.tsx`

In the "done" sub-step (line ~369, before the "Enter the Lobby" button), add:
```
<Button variant="gold-outline" size="lg" onClick={() => navigate("/drops/friendfluence")} className="w-full">
  <UserPlus /> Bring a Friend to this Drop
</Button>
```

### 5. MODIFY: `supabase/config.toml`

Add `[functions.generate-friend-invite]` with `verify_jwt = false` (auth validated in code).

## No New Libraries

Uses existing: Framer Motion, shadcn Button/Input/Card, lucide icons, Supabase realtime, react-router-dom.

## No Schema Changes

The `drop_rsvps` table already has a `friend_invite_code` column. The `drops` table already has `is_friendfluence` boolean. No migrations needed.

## Privacy

- Friend never sees inviter's identity until mutual spark
- Invite code is opaque — no PII in URL
- Friend gets standard onboarding flow before any matching

