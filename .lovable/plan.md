

## Plan: Production Polish Pass

Three concrete improvements that clear remaining launch checklist items and clean up the developer experience.

---

### Task 1: Update `.lovable/plan.md` — replace stale content

The current plan still describes trust gate enforcement, which is already shipped. Replace with the current launch checklist: Chemistry Replay Vault, AI moderation tuning, production config items, and bundle optimization.

**File:** `.lovable/plan.md`

---

### Task 2: Fix `LazyFallback` forwardRef console warning

The console shows "Function components cannot be given refs... at LazyFallback". The `LazyFallback` component in `App.tsx` is a plain function component. Wrapping it with `React.forwardRef` silences this warning, consistent with the forwardRef fixes already applied to landing components.

**File:** `src/App.tsx` — wrap `LazyFallback` with `forwardRef` and add `.displayName`

---

### Task 3: Add React Router v7 future flags

Console shows deprecation warnings about `v7_startTransition`. Adding the `future` prop to `BrowserRouter` opts in early and silences warnings.

**File:** `src/App.tsx` — add `future={{ v7_startTransition: true }}` to `<BrowserRouter>`

---

### Summary

- 2 files modified: `src/App.tsx`, `.lovable/plan.md`
- No database changes, no edge function changes
- Clears console warnings and updates stale documentation

