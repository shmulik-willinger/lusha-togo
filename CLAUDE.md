# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Lusha Togo — a React Native mobile app (Expo + TypeScript) for the Lusha B2B data platform.
Built with Expo Router (file-based navigation), NativeWind (Tailwind for RN), TanStack Query, and Zustand.

---

## Build & Deploy (MANDATORY after every code change)

```bash
bash build_and_deploy.sh
```

This script:
1. Auto-bumps the patch version in `app.json`, `package.json`, and `android/app/build.gradle`
2. Builds a **debug** APK via Gradle (fast — no ProGuard/R8)
3. Installs on the connected Android device via ADB

**Never skip this step.** The user always tests on a physical Android device.
If no ADB device is connected, the script exits silently — that's expected.
The build script has a mutex lock — if a build is already running it will skip automatically.

> ⚠️ Debug builds are used for development (faster). Release builds are only for production via EAS.

---

## Architecture

```
app/                   # Expo Router pages (file-based routing)
  (auth)/login.tsx     # WebView OAuth + email/password login
  (tabs)/              # Bottom tab screens: home, search, lists, account
  contact/[id].tsx     # Contact detail page
  company/[id].tsx     # Company detail page
  list/[id].tsx        # List detail page

src/
  api/                 # Axios API layer (client.ts, auth.ts, search.ts, lists.ts...)
  components/          # Reusable UI (ContactCard, FilterSheet, AISearchBar...)
  store/               # Zustand stores (authStore, searchStore, contactStore)
  hooks/               # React Query hooks (useSearch, useRecommendations, useLists...)
  theme/tokens.ts      # Design tokens (Lusha brand colors: #6f45ff)

android/               # Native Android/Gradle project
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app.json` | Expo config — version is source of truth |
| `android/app/build.gradle` | versionCode + versionName |
| `src/api/client.ts` | Axios instance + interceptors |
| `src/store/authStore.ts` | Session + SecureStore |
| `build_and_deploy.sh` | Build + install script |

---

## Tech Stack Differences vs HolmesPlace

| | lusha-togo | HolmesPlace |
|-|-----------|-------------|
| Framework | React Native + Expo | Capacitor (WebView) |
| Language | TypeScript | JavaScript |
| Build | Metro bundle → Gradle | Copy HTML → Gradle |
| Build time | ~3-6 min (debug) | ~1-2 min |
| Entry point | `app/` (Expo Router) | `templates/index.html` |

Build is slower by nature — Metro must transpile TypeScript and bundle all modules.
Debug mode removes ProGuard/R8 minification and cuts build time significantly vs release.

---

## Development Notes

- **TypeScript**: Strict mode. Run `npx tsc --noEmit` to type-check before major changes.
- **Styling**: NativeWind (Tailwind class names). Config in `tailwind.config.js`.
- **Auth**: WebView-based OAuth — cookies captured via `@react-native-cookies/cookies`.
- **State**: Zustand for auth session, TanStack Query for server state.
- **Navigation**: Expo Router (file-based) — add a file in `app/` to add a route.
- **No hot reload**: Each code change requires a full APK rebuild and install.
- **Screenshots**: When taking a screenshot from the emulator/device for verification, always resize it to max 1800px on the long side before adding to the conversation. Use: `sips -Z 1800 screenshot.png`. Never accumulate more than 2 screenshots in the same session — the Claude API limits images to 2000px when multiple images exist in context, and exceeding this crashes the session silently.
