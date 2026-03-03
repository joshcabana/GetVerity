

## Plan: GuardianNet Server-Side Logging

### Migration: `guardian_alerts` table

```sql
CREATE TABLE public.guardian_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.guardian_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log own alerts"
  ON public.guardian_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all alerts"
  ON public.guardian_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

Note: Using `has_role` for admin SELECT (matching existing pattern) instead of open `true`.

### GuardianNet.tsx

- Add `callId: string` to props interface
- Import `supabase` and `useAuth`
- On modal open (inside the component body, after the early return), fire-and-forget insert into `guardian_alerts` with `call_id` and `user_id`
- Zero UI changes — all existing JSX, Framer Motion, Tailwind untouched

### LiveCall.tsx

- Line 582: pass `callId={callId || ""}` to `<GuardianNet>`

### Files Modified

| File | Change |
|------|--------|
| New migration SQL | `guardian_alerts` table + RLS |
| `src/components/call/GuardianNet.tsx` | Add `callId` prop, log to DB on open |
| `src/pages/LiveCall.tsx` | Pass `callId` prop to GuardianNet |

