

## Plan: Fix RPC Type Casts & Sort Sparks by Unread

Two high-impact, low-risk improvements from the launch checklist.

---

### Task 1: Remove `(supabase.rpc as any)` casts

The generated `types.ts` already includes typed definitions for `submit_call_decision` and `update_my_profile`. The `as any` casts are unnecessary and suppress type safety.

**Files:**
- `src/pages/LiveCall.tsx` (line 284): Change `(supabase.rpc as any)("submit_call_decision", ...)` to `supabase.rpc("submit_call_decision", ...)`
- `src/pages/Profile.tsx` (lines 35, 73): Same pattern for `update_my_profile`

3 lines changed across 2 files. Zero logic change — purely removing unsafe casts.

---

### Task 2: Sort spark cards — unread first

In `src/pages/SparkHistory.tsx`, after the existing filter logic (line 102-108), sort the `filtered` array so sparks with `unread_count > 0` appear at the top, ordered by most unread first, then by `created_at` descending for the rest.

**Change:** Add `.sort()` after `.filter()`:
```ts
const filtered = sparks
  .filter(...)
  .sort((a, b) => {
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (a.unread_count === 0 && b.unread_count > 0) return 1;
    if (a.unread_count !== b.unread_count) return b.unread_count - a.unread_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
```

1 file, ~6 lines added.

---

### Summary

- 3 files modified total
- No database changes, no edge function changes
- Removes a launch checklist item (RPC type casts)
- Improves UX by surfacing unread conversations

