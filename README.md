# MediMate — AI-Powered Medication Companion

> Privacy-first, offline-capable medication management powered by **Gemma 4 AI**.
> Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good) · Deadline May 18, 2026.

---

## What is MediMate?

MediMate helps patients manage their medications safely and independently — without requiring an internet connection or sending any health data to a server. Everything runs on your device.

**Core philosophy:** AI should make healthcare more accessible, not create new privacy risks. MediMate stores all data locally in the browser's IndexedDB and processes everything through Gemma 4 running on-device via Ollama, with Google AI Studio as an optional cloud fallback.

---

## Features

### Pill Bottle Scanner

Point your camera at any pill bottle label. Gemma 4's multimodal vision reads the label and extracts the medication name, dosage, form, frequency, and instructions — then adds it directly to your medication list.

### Drug Interaction Checker

Automatically checks every combination of your current medications against a curated dataset of 50+ known interactions. Alerts are color-coded by severity: minor, moderate, major, and contraindicated. Runs entirely offline — no API call required.

### Smart Schedule

Generates a personalized daily medication timeline (morning / afternoon / evening / night). Mark doses as taken with a single tap. Listen to your schedule read aloud via the built-in voice assistant.

### Voice-First Symptom Journal

Tap the microphone and speak naturally about how you're feeling. Gemma 4 summarizes your words into a structured journal entry with mood level and symptom severity scores — ready to share with your doctor.

### Doctor Report Export

Generate a clean, printable PDF report of your medications, interaction alerts, and recent journal entries in one tap. Share it at your next appointment without needing an internet connection.

### Patient Profile & Settings

Store your name, age, known allergies, medical conditions, and emergency contact — all locally on your device. Your name appears on the exported doctor report.

---

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16 (App Router)                              |
| Language   | TypeScript                                           |
| Styling    | Tailwind CSS v4                                      |
| AI — local | Gemma 4 via Ollama (`gemma4:e4b`)                    |
| AI — cloud | Google AI Studio (Gemini API)                        |
| Storage    | IndexedDB (raw browser API, no library)              |
| Voice      | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Camera     | `navigator.mediaDevices.getUserMedia`                |
| PWA        | Next.js manifest + custom service worker             |

---

## AI Architecture

MediMate uses a **hybrid AI backend** that automatically selects the best available option:

```
User Action
    │
    ▼
Resolve Backend
    ├─ Ollama running locally? → Gemma 4 on-device (fully private)
    └─ No Ollama?             → Google AI Studio (cloud, API key required)
```

All AI responses stream in real time. The active backend is visible in the sidebar and dashboard header.

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running (for local AI)

### 1. Clone and install

```bash
git clone https://github.com/7maylord/medimatey.git
cd medimatey
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

| Variable            | Description                              | Default                  |
| ------------------- | ---------------------------------------- | ------------------------ |
| `OLLAMA_BASE_URL`   | Ollama server URL                        | `http://localhost:11434` |
| `OLLAMA_MODEL`      | Model name                               | `gemma4:e4b`             |
| `GOOGLE_AI_API_KEY` | Google AI Studio key (optional fallback) | —                        |

### 3. Pull the Gemma 4 model

```bash
ollama pull gemma4:e4b
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/     # Main dashboard — schedule, medications, interaction alerts
│   ├── scan/          # Pill bottle camera scanner
│   ├── schedule/      # Daily medication timeline
│   ├── journal/       # Voice symptom journal
│   ├── report/        # Printable doctor report
│   ├── settings/      # Patient profile
│   └── api/           # Route handlers (chat, analyze-pill, interactions, ai-status)
├── components/
│   └── layout/        # Sidebar, mobile nav, service worker registration
├── hooks/
│   ├── useAI.ts       # Unified AI client hook (streaming)
│   ├── useCamera.ts   # Camera capture hook
│   ├── useSpeech.ts   # Web Speech API hook
│   └── useStorage.ts  # IndexedDB React hooks
├── lib/
│   ├── ai-client.ts   # Backend resolver (Ollama → Google AI)
│   ├── ollama.ts      # Ollama streaming client
│   ├── google-ai.ts   # Google AI Studio client
│   ├── drug-data.ts   # Interaction dataset + synchronous checker
│   ├── prompts.ts     # Gemma 4 system prompts
│   └── storage.ts     # IndexedDB CRUD layer
└── data/
    └── interactions.json  # 50+ curated drug-drug interactions
```

---

## PWA — Install on Your Phone

MediMate is a full Progressive Web App. On Android Chrome, tap **"Add to Home Screen"** to install it. Once installed:

- Works completely offline after first load
- App icon on your home screen
- Fullscreen, no browser chrome
- Quick-launch shortcuts for Scan, Schedule, and Journal

---

## Privacy

- **No accounts.** No sign-up required.
- **No cloud storage.** All medication data, journal entries, and your profile live in your browser's IndexedDB.
- **No tracking.** No analytics, no telemetry.
- **On-device AI by default.** When Ollama is running, nothing leaves your device — not even AI requests.
- Clearing your browser data will erase all stored information.

---

## Medical Disclaimer

MediMate is **not** a substitute for professional medical advice, diagnosis, or treatment. Drug interaction data is curated for educational purposes and may not be complete. Always consult a qualified healthcare provider before making any changes to your medication routine.

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

Built with Gemma 4 for the Gemma 4 Good Hackathon.
