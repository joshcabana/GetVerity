

## Recommendation: Enforce Trust Gates on Drop Participation

### Why this is next

Trust gate enforcement is the most important remaining item for pilot readiness. Currently, onboarding collects phone/selfie/pledge data, but there's no hard block preventing unverified users from RSVPing to Drops or joining calls. This is a safety requirement — every user in a live call must be identity-verified.

### What changes

**1. Lobby page — block RSVP for unverified users**
- In `src/pages/Lobby.tsx`, check `userTrust` from `useAuth()` before allowing RSVP
- If trust requirements are incomplete, show a prompt directing the user to complete onboarding instead of the RSVP button
- Respect the `requirePhoneVerification` feature flag (some deployments may not require phone)

**2. LiveCall page — server-side guard**
- The `find-match` edge function should verify the caller's trust status before matching
- Add a check in `supabase/functions/find-match/index.ts` that queries `user_trust` for the authenticated user and rejects if `selfie_verified`, `safety_pledge_accepted`, or `phone_verified` (when required) are false

**3. ProtectedRoute — add `requireTrust` to Lobby and LiveCall routes**
- `ProtectedRoute` already has a `requireTrust` prop — wire it into the route definitions for `/lobby` and `/live-call` in `App.tsx`

### Files modified
- `src/App.tsx` — add `requireTrust` to Lobby and LiveCall routes
- `src/pages/Lobby.tsx` — disable RSVP button with verification prompt for unverified users
- `supabase/functions/find-match/index.ts` — server-side trust check before matching

### No database changes needed
`user_trust` table and `get-feature-flags` already exist with the required columns.

