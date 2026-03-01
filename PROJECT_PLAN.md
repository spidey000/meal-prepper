# AI Family Meal Planner – Project Plan
_Last updated: 2026-02-27_

**Usage**: Read this document before picking up new work. Update status indicators as tasks progress.

Legend:
- [x] Complete
- [~] In progress
- [ ] Not started
- [!] Blocked

## Phase 0 – Repo & Tooling (Day 0)
1. [x] Initialize git repo and connect remote `spidey000/meal-prepper`.
2. [x] Scaffold Vite React TS template via `npm create vite@latest`.
3. [x] Install dependencies and capture `package-lock.json`.
   - Re-run `npm install` (first attempt timed out) and verify lockfile is generated.
4. [x] Commit & push baseline scaffold once lockfile exists.

## Phase 1 – Application Foundation (Days 1-2)
1. [x] Remove Vite demo assets (logos, counter) and reset `App.tsx` & base styles.
2. [x] Introduce design system (Tailwind, tokens, typography, spacing scale, light/dark palettes).
3. [x] Configure React Router with authenticated + guest layouts, navigation shell, toasts, loading/skeleton states.
4. [x] Add state/query tooling (React Query + Zustand or equivalent) and provider composition.
5. [x] Configure environment handling (`.env`, `.env.example`, `vite-env.d.ts`) for OpenRouter + local profile storage toggles.
6. [x] Implement global error boundary and fallback UI.

## Phase 2 – Local Profiles & Persistence (Days 2-4)
1. [ ] Build username-based onboarding that lets users create/select a local profile before entering the app.
2. [ ] Persist every profile's family, schedule, recipes, and settings via isolated localStorage buckets.
3. [ ] Provide profile management UI (rename/delete/reset) and ensure switching hydrates the correct data.
4. [ ] Document the local-only flow plus recommended backup/export reminders.

## Phase 3 – Guest Mode Enhancements (Days 3-4)
1. [ ] Allow continuing as a temporary guest profile with a prominent CTA to save progress under a username.
2. [ ] Implement OpenRouter API key storage rules for local mode (per profile, optional encryption).
3. [ ] Provide guidance for exporting/importing profile data for manual backups.
4. [ ] Add clear warning/CTA gating AI features until an API key is provided in the active profile.

## Phase 4 – Family Profiles (Days 4-5)
1. [ ] Build CRUD UI for members, including allergies, dietary preferences, activity level, school/work schedule, and notes.
2. [ ] Enable diner selection per meal slot (who eats breakfast/lunch/dinner at home each day).
3. [ ] Validate forms with Zod + react-hook-form; add inline error handling and autosave.
4. [ ] Surface combined household constraints summary (allergies, preferences) for AI prompts.

## Phase 5 – Schedule & Availability (Days 5-6)
1. [ ] Implement weekly calendar grid with manual availability sliders for lunch/dinner.
2. [ ] Integrate Google Calendar sync (OAuth), ICS upload, and manual entry merging.
3. [ ] Build AI-assisted ingestion flows: text parser and screenshot parser (OpenRouter vision models) producing structured schedule JSON.
4. [ ] Calculate daily availability (minutes per meal) and persist per profile in local storage.
5. [ ] Auto-detect Google Calendar free/busy windows, annotate daily `freeBlocks`, and flag imported sources.
6. [ ] Add UI toggles + persistence for marking batch cooking days and adjusting availability caps.
7. [ ] Push accepted meal prep/batch sessions back to Google Calendar and store sync metadata.

## Phase 6 – AI Meal Planning & Recipes (Days 6-8)
1. [ ] Implement `MealAIService` abstraction supporting tasks: `planWeek`, `regenerateMeal`, `shoppingList`, `parseScheduleText`, `parseScheduleImage`.
2. [ ] Configure OpenRouter client (base URL, headers `HTTP-Referer`, `X-Title`), expose model selection.
3. [ ] Build Netlify serverless functions proxying OpenRouter for browser clients (pull API key from server-side secret, enforce quotas/logging).
4. [ ] Implement client-side call path for guests (direct fetch using their key, with retry + JSON validation).
5. [ ] Create UI to generate a weekly plan, show progress indicator, and allow regenerating individual meals while preserving context.
6. [ ] Persist generated recipes + daily menus; enable manual edits and acceptance tracking.

## Phase 7 – Shopping List & Pantry (Days 8-9)
1. [ ] Aggregate ingredients across accepted recipes, normalize units, and categorize by supermarket aisle.
2. [ ] Display estimated costs (OpenRouter or heuristics) with ability to override.
3. [ ] Support multi-device editing, checkboxes, notes ("buy lactose-free").
4. [ ] Provide export options (print, CSV, shareable link) and offline-friendly view for mobile.

## Phase 8 – Settings & Preferences (Day 9)
1. [ ] Build settings screen for AI provider selection, API key management, preferred cuisines, default meal times, max cooking time.
2. [ ] Add prompt customization UI with safe defaults and reset-to-template.
3. [ ] Implement notification/reminder toggles (email/push placeholders) and data backup/export tools.

## Phase 9 – Quality, Testing & Deployment (Day 10)
1. [ ] Add unit/integration tests (Vitest + React Testing Library) for hooks, components, reducers.
2. [ ] Record AI contract tests ensuring JSON schema compliance (zod validation + mock responses).
3. [ ] Configure Playwright smoke flows (auth, guest mode, meal plan generation, shopping list).
4. [ ] Set up lint/format/test steps in CI (GitHub Actions or Netlify).
5. [ ] Configure Netlify build pipeline, environment variables, OpenRouter keys, and preview deployments.
6. [ ] Add monitoring/logging for Netlify functions (Edge Functions logs, Sentry optional).

## Phase 10 – Documentation & Handoff
1. [ ] Rewrite README with stack overview, env setup, run/build/test scripts, deployment steps, and troubleshooting.
2. [ ] Document local profile storage format, backup instructions, and any optional server components.
3. [ ] Capture AI prompt templates + best practices for future tuning.
4. [ ] Provide release checklist and future work backlog.

## Next Immediate Actions
1. ✅ Re-run `npm install` to create `package-lock.json`, then stage scaffold files.
2. ✅ Commit/push baseline scaffold before large changes.
3. ▶ Begin Phase 2 work: local profile onboarding + storage refactor.
