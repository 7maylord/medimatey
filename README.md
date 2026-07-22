# MediMate

Privacy-first medication companion. Monorepo:

| Folder | What | Status |
| --- | --- | --- |
| [`frontend/`](frontend/) | Next.js 16 PWA — the original web app (scan, schedule, safety checks, journal, reports) | Complete — see its README |
| [`mobile/`](mobile/) | Expo / React Native app — reliable closed-app reminders + on-device potential the browser can't offer | In progress |
| [`backend/`](backend/) | Phase-B caregiver relay (push alerts, caregiver visibility) | Placeholder — gated on validating the caregiver wedge (`docs/briefs/`) |

The domain layer (types, schedule cadence, allergy/interaction safety, drug data) is plain
TypeScript shared by porting: `frontend/src/lib` ↔ `mobile/lib`.

Product direction, decisions, and open questions live in [`docs/briefs/brief-medimate-2026-07-20/`](docs/briefs/brief-medimate-2026-07-20/).
