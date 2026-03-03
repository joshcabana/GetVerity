## Launch Checklist — Remaining Items

### Features
1. **Chemistry Replay Vault** — 8-second anonymized highlight reel from mutual-spark calls, gated behind Verity Pass subscription.

### Tuning & Ops
2. **AI moderation threshold tuning** — adjust risk-score thresholds with real pilot data.
3. **Bundle size optimization** — analyze large chunks, apply further code-splitting or tree-shaking.

### Manual Configuration (external dashboards)
4. Configure Stripe Webhooks (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid).
5. Verify `avatars` storage bucket is public.
6. Configure Twilio for phone OTP in auth settings.
7. Enable Password HIBP Check in auth settings.
8. Configure 301 redirects from `getverity.com` → `getverity.com.au`.
9. End-to-end verification of MediaRecorder (Voice Intro) and WebRTC (Agora) flows.

### Completed ✅
- Trust gate enforcement (route guards, RSVP block, server-side find-match check)
- Production polish pass (forwardRef fix, React Router v7 future flags)
