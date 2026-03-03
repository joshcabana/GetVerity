

## Plan: Final Production Polish + Launch Lock

### 1. Update test Friendfluence Drop scheduled_at
- UPDATE the drop with ID `2f97af95-4a62-4724-abff-718fa6c5eaa7` to set `scheduled_at = NOW() + interval '3 hours'` so it remains "upcoming".
- Uses the data insert tool (not migration).

### 2. Fix forwardRef console warnings
Console logs show two warnings, both from the `Landing` page:
- **CTASection** -- plain function component receiving a ref
- **Footer** -- plain function component receiving a ref

**Root cause**: React's internal reconciliation (via Suspense/lazy) attempts to attach refs to these child components. Since they're plain function components, the ref is silently dropped and a dev warning is logged.

**Fix**: Wrap both components with `React.forwardRef` and forward the ref to their root element. No logic changes -- just ref plumbing.

#### Files modified
| File | Change |
|------|--------|
| `src/components/landing/CTASection.tsx` | Wrap with `forwardRef`, forward ref to `<section>` |
| `src/components/landing/Footer.tsx` | Wrap with `forwardRef`, forward ref to `<footer>` |

### 3. Deployment
- Changes auto-sync to the connected GitHub repo (`joshcabana/GetVerity`) via the Lovable publish flow. There is no manual "force push" or Netlify trigger available from within Lovable -- publishing the project pushes to GitHub, which triggers any connected CI/CD (Netlify).
- The live preview at `spark-echo-verity.lovable.app` updates immediately after publish.

### 4. Scope exclusions
- VerityLogo, Navbar, HeroSection, StatsSection, FeaturesSection, InnovationsSection do not appear in console warnings -- no changes needed.
- No schema migrations required.

