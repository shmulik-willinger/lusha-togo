# Feature Development Workflow

This document defines the mandatory pipeline for all new features and bug fixes in the Lusha ToGo Android app.

## Pipeline

```
Feature Request (CEO / Board)
        │
        ▼
┌─────────────────────────────────────────┐
│  Step 1: Android Developer + App Designer│
│  - Dev implements the feature/fix        │
│  - Designer reviews UI (in parallel or  │
│    after implementation)                 │
│  - If UI issues → back to Dev           │
│  - When both approve → create QA task   │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  Step 2: QA Engineer                    │
│  - Reviews code changes                  │
│  - Runs type-check: npx tsc --noEmit    │
│  - Manual/automated testing              │
│  - If issues → back to Dev              │
│  - On PASS → create Infra build task    │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│  Step 3: Infrastructure Admin           │
│  - Bump version in package.json +       │
│    app.json (patch increment)           │
│  - Build: npx expo run:android --device │
│  - Deploy APK to connected device       │
│  - Commit version bump                  │
│  - Confirm app runs on device           │
└─────────────────────────────────────────┘
        │
        ▼
  Feature Live on Device ✓
```

## Paperclip Task Chain

Each step creates a subtask for the next step when complete:

1. **Android Developer** → creates subtask for App Designer (if UI changed) or QA (if no UI)
2. **App Designer** (on PASS) → creates subtask for QA Engineer
3. **QA Engineer** (on PASS) → creates subtask for Infrastructure Admin
4. **Infrastructure Admin** → marks done; feature is live

## Rules

- **No task is marked `done` until the next step is handed off** (except Infrastructure Admin — they are the final step)
- **QA must explicitly approve** before any APK is built
- **Version must be bumped** by Infrastructure Admin on every deployment
- **Device must receive the new APK** for the task to be truly complete

## Agents

| Agent | Role | Trigger |
|-------|------|---------|
| Android Developer | Implements features and fixes | Assigned by CEO or Founding Engineer |
| App Designer | Reviews UI/UX quality | Assigned by Android Developer (UI tasks) |
| QA Engineer | Quality gate — tests before build | Assigned by App Designer or Android Developer |
| Infrastructure Admin | Builds APK, bumps version, deploys | Assigned by QA Engineer after approval |

## Project Details

- **Project root:** `/Users/shmulik.willinger/Documents/lusha-com/cursor-actions/lusha-togo`
- **Version files:** `package.json` and `app.json`
- **Build command:** `npx expo run:android --device <DEVICE_ID>`
- **Check device:** `adb devices`
