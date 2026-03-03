

## Plan: VoiceIntroBanner Playback + Tests + PROJECT_OVERVIEW Update

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/chat/VoiceIntroBanner.tsx` | Rewrite with real signed-URL audio playback |
| `src/pages/Chat.tsx` | Fetch `voice_intro_a`, `voice_intro_b`, `user_a` from spark; render banner |
| `src/test/VoiceIntro.test.tsx` | Unit tests for VoiceIntro capture flow |
| `src/test/GuardianNet.test.tsx` | Unit tests for GuardianNet alert logging |
| `PROJECT_OVERVIEW.md` | Mark Voice Intro + Guardian Net complete, add date, note beta-ready |

No migration needed — `voice-intros` bucket and spark columns already exist.

---

### VoiceIntroBanner.tsx

**New props:**
```typescript
interface VoiceIntroBannerProps {
  storagePath: string;
  matchName: string;
}
```

**Logic:**
- On mount: call `supabase.storage.from('voice-intros').createSignedUrl(storagePath, 3600)`
- States: `loading` (skeleton pulse), `error` ("Unavailable" muted text), `ready` (player)
- `useRef<HTMLAudioElement>` for playback; `timeupdate` event drives waveform progress
- `loadedmetadata` event sets actual duration (displayed as `M:SS`)
- `useMemo` stabilizes random waveform bar heights across re-renders
- Play/Pause toggle on existing button; `onended` resets state
- Preserve existing Framer Motion animation, gold/dark Tailwind classes, and layout structure

### Chat.tsx

**Changes (minimal):**
- Expand spark fetch to select `voice_intro_a, voice_intro_b, user_a` alongside `user_a, user_b`
- New state: `partnerVoicePath: string | null`
- Determine partner path: if user is `user_a` → `voice_intro_b`, else `voice_intro_a`
- Above the message list, render:
  - If path exists and is not `"skipped"`: `<VoiceIntroBanner storagePath={path} matchName={partnerName} />`
  - If path is `"skipped"`: small muted text "They skipped their voice intro"
  - If path is null: nothing

### Test Files

**VoiceIntro.test.tsx** — mock `supabase`, `navigator.mediaDevices`, test:
- Phase transitions (intro → recording → recorded → listening → done)
- Skip writes `"skipped"` to DB
- Upload calls storage + updates spark column

**GuardianNet.test.tsx** — mock `supabase`, `useAuth`, test:
- Opening modal inserts into `guardian_alerts`
- Only logs once per open (loggedRef guard)
- Does not log when closed

### PROJECT_OVERVIEW.md

- Phase 4 row: change "Roadmap" → "Complete"
- Add Voice Intro and Guardian Net to §3.1 Completed list
- Update date to March 3, 2026
- Add "Beta-ready" note at top

