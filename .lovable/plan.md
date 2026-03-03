

# Security Scan Results & Build Fix Plan

## Build Error Fix

The build error `Module '"@testing-library/react"' has no exported member 'screen'` is caused by `@testing-library/react` v16 requiring React 19 types, while this project uses React 18. The fix is to downgrade `@testing-library/react` to v14 (the last version compatible with React 18).

**Change**: In `package.json`, change `"@testing-library/react": "^16.0.0"` to `"@testing-library/react": "^14.3.1"`.

---

## Security Scan Summary

The scan found **15 findings**. Here's the breakdown:

### Already Addressed (Informational — No Action Needed)

These are either intentional design choices or positive confirmations already documented in the existing security findings:

| Finding | Level | Verdict |
|---------|-------|---------|
| All tables have RLS enabled | info | ✅ Positive finding |
| Profile data publicly readable | error* | ✅ Intentional for matchmaking (already ignored) |
| user_trust protected by user-scoped RLS | error* | ✅ Already properly scoped — no cross-user leakage |
| token_transactions user-scoped | error* | ✅ Already restricted to own rows |
| Platform stats publicly accessible | info | ✅ Intentional for transparency page |
| Rooms publicly readable | info | ✅ Intentional for lobby browsing |
| Drops publicly readable | info | ✅ Intentional for event discovery |
| App config publicly readable | info | ✅ Only contains non-sensitive feature flags |

*The scanner flags these as "error" but they're by design for a dating/matching app.

### One Actionable Finding: Stripe Customer ID Exposure

**The `stripe_customer_id` column is visible in the profiles table** which has a public SELECT policy for authenticated users. This is a real issue — other users shouldn't see each other's Stripe customer IDs.

**Fix**: Create a database migration to restrict the profiles SELECT policy. Instead of exposing all columns, use a database view or adjust the policy. The simplest approach: **drop the `stripe_customer_id` from the public-facing profiles query by using column-level security via a restricted view**, or more practically, update the RLS SELECT policy to exclude this column by keeping the column but only allowing the owner to see it.

Since Postgres RLS is row-level (not column-level), the cleanest fix is:
1. Remove `stripe_customer_id` from the `profiles` table entirely
2. Store it in a new private `user_payment_info` table with owner-only RLS
3. Update `create-checkout` and `stripe-webhook` edge functions to read from the new table

### Warnings to Acknowledge (Low Risk, Already Mitigated)

These are valid observations but have existing mitigations. I'll update the security findings to document the accepted risk:

- **Push subscription credentials** — user-scoped RLS, acceptable risk
- **Agora channel IDs** — participant-scoped RLS + token-gated access
- **Voice intro/message URLs** — member-scoped RLS, signed URLs recommended for future
- **Report evidence URLs** — reporter-scoped, acceptable for appeals
- **Moderation clip URLs** — flagged users seeing evidence is a product decision
- **Friend invite codes** — user-scoped, acceptable risk

## Implementation Steps

1. **Fix the build error** — downgrade `@testing-library/react` to v14
2. **Migrate `stripe_customer_id`** — move to a new `user_payment_info` table with owner-only RLS
3. **Update edge functions** — `create-checkout` and `stripe-webhook` to use the new table
4. **Update security findings** — acknowledge/ignore the informational and low-risk warnings with documented rationale

