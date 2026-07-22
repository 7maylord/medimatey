# MediMate Mobile

Expo / React Native port of MediMate — built because native mobile does the two things
the web app structurally couldn't: **reliable closed-app dose reminders** (scheduled
local notifications, no server) and true **on-device AI**.

The domain layer is ported verbatim from `../frontend/src` (same `@/` alias):
`src/types`, `src/lib/{safety,drug-data,prompts,schedule-utils}.ts`, `src/data/interactions.json`.
Self-checks: `node src/lib/safety.test.mjs && node src/lib/schedule-utils.test.mjs`.

## Milestones

1. Med list + schedule + **scheduled local notifications with mark-taken** (expo-notifications, expo-sqlite)
2. Camera scan → AI extraction (expo-camera; cloud first, on-device Gemma later)
3. Caregiver alerts via `../backend` — only after the caregiver wedge is validated (see `../docs/briefs/`)

## Run

```bash
npm install
npx expo start        # then i (iOS sim), a (Android), or scan QR in Expo Go
```

Created with `create-expo-app` (Expo SDK 57, expo-router, TypeScript).
