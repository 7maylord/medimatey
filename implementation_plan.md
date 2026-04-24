# MediMate — Implementation Plan

Build a privacy-first medication companion app for the **Gemma 4 Good Hackathon** (deadline: May 18, 2026).

---

## Confirmed Decisions

- ✅ **Tech stack**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- ✅ **AI backend**: **Hybrid** — Ollama (local dev/demo video) + Google AI Studio API (deployed Vercel demo)
- ✅ **Drug data**: Curated JSON dataset (~200 common interactions) embedded in the app
- ✅ **Deployment**: Vercel for live demo, Ollama for local dev
- ✅ **Language**: English-only for MVP
- ✅ **PWA**: Yes — strengthens the offline story

---

## Proposed Changes

The project will be organized into **5 phases**, roughly mapping to the PRD's weekly roadmap but compressed for efficiency.

---

### Phase 1: Project Foundation & Design System

Set up the Next.js project, design system, and core layout.

#### [NEW] Next.js Project Scaffold

```bash
npx create-next-app@latest ./ --typescript --tailwind --app --src-dir --eslint --use-npm
```

Key project structure:

```
medicare/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts, metadata, providers
│   │   ├── page.tsx            # Landing/home page
│   │   ├── globals.css         # Tailwind + custom design tokens
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard (post-onboarding)
│   │   ├── scan/
│   │   │   └── page.tsx        # Pill bottle scanner
│   │   ├── schedule/
│   │   │   └── page.tsx        # Medication schedule view
│   │   ├── journal/
│   │   │   └── page.tsx        # Symptom journal
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts    # Ollama chat endpoint
│   │       ├── analyze-pill/
│   │       │   └── route.ts    # Multimodal pill analysis
│   │       └── interactions/
│   │           └── route.ts    # Drug interaction check
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── scanner/
│   │   │   ├── CameraView.tsx
│   │   │   └── ScanResult.tsx
│   │   ├── voice/
│   │   │   ├── VoiceInput.tsx
│   │   │   └── VoiceOutput.tsx
│   │   ├── schedule/
│   │   │   ├── MedCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── ReminderBanner.tsx
│   │   ├── journal/
│   │   │   ├── EntryCard.tsx
│   │   │   └── EntryForm.tsx
│   │   └── shared/
│   │       ├── SafetyDisclaimer.tsx
│   │       ├── LoadingPulse.tsx
│   │       └── StatusIndicator.tsx
│   ├── hooks/
│   │   ├── useOllama.ts        # Ollama client hook
│   │   ├── useCamera.ts        # Camera capture hook
│   │   ├── useSpeech.ts        # Speech recognition + synthesis
│   │   └── useLocalStorage.ts  # IndexedDB/localStorage wrapper
│   ├── lib/
│   │   ├── ai-client.ts        # Unified AI client (Ollama local + Google AI Studio fallback)
│   │   ├── ollama.ts           # Ollama API client
│   │   ├── google-ai.ts        # Google AI Studio API client
│   │   ├── drug-data.ts        # Drug interaction dataset + lookup
│   │   ├── prompts.ts          # Gemma 4 system prompts + function schemas
│   │   ├── schedule.ts         # Schedule generation logic
│   │   └── storage.ts          # Local persistence (IndexedDB)
│   ├── data/
│   │   └── interactions.json   # Curated drug interaction dataset (~200 entries)
│   └── types/
│       └── index.ts            # TypeScript types for medications, schedules, etc.
├── public/
│   ├── icons/                  # App icons for PWA
│   └── sounds/                 # Notification sounds
└── package.json
```

#### [NEW] [globals.css](file:///Users/macbook/Programming/medicare/src/app/globals.css)

- Healthcare-focused design system
- Color palette: Deep teal primary (`#0D9488`), warm coral accents, soft neutrals
- Dark mode with rich navy backgrounds
- Glassmorphism card styles
- Smooth micro-animation keyframes (pulse, slide-in, fade)
- Custom scrollbar styling

#### [NEW] [layout.tsx](file:///Users/macbook/Programming/medicare/src/app/layout.tsx)

- Google Fonts: **Inter** (body) + **Outfit** (headings)
- SEO metadata for MediMate
- Theme provider (dark/light mode)
- Global safety disclaimer context

---

### Phase 2: Core UI Pages & Components

Build all the visual pages and interactive components.

#### [NEW] Landing Page — [page.tsx](file:///Users/macbook/Programming/medicare/src/app/page.tsx)

- Hero section with animated pill/health graphics
- "Get Started" CTA → onboarding flow
- Feature highlights (scan, voice, schedule, journal)
- Privacy badge ("100% Offline • Your Data Never Leaves Your Device")
- Responsive design

#### [NEW] Dashboard — [dashboard/page.tsx](file:///Users/macbook/Programming/medicare/src/app/dashboard/page.tsx)

- Today's medication timeline (morning → night)
- Quick-action cards: Scan Pill, Voice Check-in, View Schedule
- Recent symptom entries
- Active interaction warnings (if any)
- Ollama connection status indicator

#### [NEW] Pill Scanner — [scan/page.tsx](file:///Users/macbook/Programming/medicare/src/app/scan/page.tsx)

- Live camera viewfinder with overlay guide
- Capture button with haptic-style animation
- Post-capture: AI analysis results (drug name, dosage, instructions)
- "Add to My Medications" action
- Manual entry fallback

#### [NEW] Schedule View — [schedule/page.tsx](file:///Users/macbook/Programming/medicare/src/app/schedule/page.tsx)

- Daily/weekly toggle view
- Color-coded medication timeline
- Tap-to-mark-taken functionality
- Voice reminder preview ("Tap to hear your schedule")

#### [NEW] Symptom Journal — [journal/page.tsx](file:///Users/macbook/Programming/medicare/src/app/journal/page.tsx)

- Voice-first entry (tap mic → speak → AI summarizes)
- Text fallback input
- Entry history with date grouping
- Mood/severity indicators
- Export-ready formatting

#### [NEW] Shared Components

- `SafetyDisclaimer.tsx` — Persistent "Not medical advice" banner
- `LoadingPulse.tsx` — AI-thinking animation (health-themed)
- `StatusIndicator.tsx` — Ollama connection status (green/red dot)
- `VoiceInput.tsx` — Animated microphone button with waveform
- `VoiceOutput.tsx` — Text-to-speech with visual playback indicator

---

### Phase 3: Hybrid AI Integration (Ollama + Google AI Studio)

Wire up the AI backend with automatic fallback.

#### [NEW] [lib/ai-client.ts](file:///Users/macbook/Programming/medicare/src/lib/ai-client.ts)

- Unified `AIClient` that detects available backend
- Priority: Ollama (local) → Google AI Studio (cloud)
- Common interface: `chat()`, `analyzeImage()`, `generateWithTools()`
- Backend status exposed to UI ("Running locally" vs "Using cloud")

#### [NEW] [lib/ollama.ts](file:///Users/macbook/Programming/medicare/src/lib/ollama.ts)

- `OllamaClient` class wrapping `http://localhost:11434`
- Methods: `chat()`, `analyzeImage()`, `generateWithTools()`
- Streaming support for real-time responses
- Connection health check
- Error handling + retry logic

#### [NEW] [lib/google-ai.ts](file:///Users/macbook/Programming/medicare/src/lib/google-ai.ts)

- `GoogleAIClient` class wrapping Google AI Studio REST API
- Uses `GOOGLE_AI_API_KEY` env variable
- Same interface as OllamaClient for seamless fallback
- Streaming support

#### [NEW] [lib/prompts.ts](file:///Users/macbook/Programming/medicare/src/lib/prompts.ts)

- **System prompt**: MediMate persona ("You are a caring medication assistant…")
- **Pill analysis prompt**: Multimodal prompt for OCR + drug identification
- **Interaction check prompt**: Function-calling schema for structured interaction checks
- **Schedule generation prompt**: Function-calling schema → JSON schedule output
- **Symptom summary prompt**: Condense voice input into structured journal entry
- Safety preamble injected into every prompt

#### [NEW] [lib/drug-data.ts](file:///Users/macbook/Programming/medicare/src/lib/drug-data.ts)

- Load + index the curated interaction dataset
- `checkInteractions(drugA, drugB)` → severity + description
- `searchDrug(name)` → fuzzy match against dataset
- `getAllInteractionsFor(drugList)` → batch check

#### [NEW] API Routes

- `api/chat/route.ts` — General conversation with Gemma 4 (streaming)
- `api/analyze-pill/route.ts` — Accept base64 image → multimodal analysis → structured drug info
- `api/interactions/route.ts` — Accept drug list → check all pairs → return warnings

#### [NEW] [hooks/useAI.ts](file:///Users/macbook/Programming/medicare/src/hooks/useAI.ts)

- React hook wrapping API routes
- State management: `loading`, `error`, `response`, `isConnected`, `backend` (ollama | google-ai)
- Streaming response handler for real-time UI updates
- Exposes which backend is active to the UI

---

### Phase 4: Camera, Voice & Local Storage

Implement the hardware-interfacing features.

#### [NEW] [hooks/useCamera.ts](file:///Users/macbook/Programming/medicare/src/hooks/useCamera.ts)

- `navigator.mediaDevices.getUserMedia()` wrapper
- Capture frame to base64
- Camera switch (front/back)
- Permission handling

#### [NEW] [hooks/useSpeech.ts](file:///Users/macbook/Programming/medicare/src/hooks/useSpeech.ts)

- Speech Recognition: Web Speech API with `webkitSpeechRecognition` fallback
- Speech Synthesis: `SpeechSynthesisUtterance` for voice output
- States: `isListening`, `transcript`, `isSpeaking`
- Auto-stop after silence detection

#### [NEW] [lib/storage.ts](file:///Users/macbook/Programming/medicare/src/lib/storage.ts)

- IndexedDB wrapper (using `idb` library or raw API)
- Stores: `medications`, `schedule`, `journal_entries`, `user_profile`
- CRUD operations for each store
- Export all data as JSON (for doctor report)

#### [NEW] [hooks/useLocalStorage.ts](file:///Users/macbook/Programming/medicare/src/hooks/useLocalStorage.ts)

- React hook for IndexedDB operations
- Auto-sync state with storage
- Optimistic updates

---

### Phase 5: Polish, PWA & Submission Prep

Final polish, performance, and hackathon deliverables.

#### [MODIFY] All pages

- Add micro-animations (Framer Motion or CSS)
- Ensure full responsive design (mobile-first)
- Accessibility audit (ARIA labels, keyboard navigation)
- Loading skeletons for AI responses

#### [NEW] PWA Setup (if approved)

- `next.config.js` — PWA plugin configuration
- `public/manifest.json` — App manifest
- Service worker for offline caching

#### [NEW] Doctor Report Export

- Generate PDF from medication + journal data
- Clean, professional formatting
- One-tap export from dashboard

---

## Verification Plan

### Automated Tests

```bash
# Build verification
npm run build

# Lint check
npm run lint

# Type checking
npx tsc --noEmit
```

### Manual Verification

1. **Camera**: Test pill bottle scanning with real bottles / printed labels
2. **Voice**: Test speech recognition + synthesis in Chrome
3. **Ollama**: Verify connection to local Ollama with `gemma4:e4b` model
4. **Interactions**: Test known drug interaction pairs (e.g., Warfarin + Aspirin)
5. **Offline**: Disconnect internet → verify all features still work
6. **Mobile**: Test on Android Chrome (primary target audience)
7. **Browser**: Full walkthrough recording via browser tool

### Hackathon Deliverables Checklist

- [ ] Public GitHub repo with clear README
- [ ] Live demo URL (Vercel or local)
- [ ] 3-minute YouTube video
- [ ] Kaggle writeup (≤1,500 words)
- [ ] Cover image + media gallery
