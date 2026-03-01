# AI Family Meal Planner – Project Plan

_Last updated: 2026-03-01_

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

1. [x] Build CRUD UI for members, including allergies, dietary preferences, activity level, school/work schedule, and notes.
2. [ ] Enable diner selection per meal slot (who eats breakfast/lunch/dinner at home each day).
3. [x] Validate forms with Zod + react-hook-form; add inline error handling and autosave.
4. [x] Surface combined household constraints summary (allergies, preferences) for AI prompts.

## Phase 5 – Schedule & Availability (Days 5-6)

1. [ ] Implement weekly calendar grid with manual availability sliders for lunch/dinner.
2. [ ] Integrate Google Calendar sync (OAuth), ICS upload, and manual entry merging.
3. [ ] Build AI-assisted ingestion flows: text parser and screenshot parser (OpenRouter vision models) producing structured schedule JSON.
4. [ ] Calculate daily availability (minutes per meal) and persist per profile in local storage.
5. [ ] Auto-detect Google Calendar free/busy windows, annotate daily `freeBlocks`, and flag imported sources.
6. [ ] Add UI toggles + persistence for marking batch cooking days and adjusting availability caps.
7. [ ] Push accepted meal prep/batch sessions back to Google Calendar and store sync metadata.

## Phase 6 – AI Meal Planning & Recipes (Days 6-8)

1. [x] Implement `MealAIService` abstraction supporting tasks: `planWeek`, `regenerateMeal`, `shoppingList`, `parseScheduleText`, `parseScheduleImage`.
2. [x] Configure OpenRouter client (base URL, headers `HTTP-Referer`, `X-Title`), expose model selection.
3. [ ] Build Netlify serverless functions proxying OpenRouter for browser clients (pull API key from server-side secret, enforce quotas/logging).
4. [x] Implement client-side call path for guests (direct fetch using their key, with retry + JSON validation).
5. [x] Create UI to generate a weekly plan, show progress indicator, and allow regenerating individual meals while preserving context.
6. [x] Persist generated recipes + daily menus; enable manual edits and acceptance tracking.

## Phase 7 – Shopping List & Pantry (Days 8-9)

1. [x] Aggregate ingredients across accepted recipes, normalize units, and categorize by supermarket aisle.
2. [ ] Display estimated costs (OpenRouter or heuristics) with ability to override.
3. [ ] Support multi-device editing, checkboxes, notes ("buy lactose-free").
4. [ ] Provide export options (print, CSV, shareable link) and offline-friendly view for mobile.

## Phase 8 – Settings & Preferences (Day 9)

1. [x] Build settings screen for AI provider selection, API key management, preferred cuisines, default meal times, max cooking time.
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

1. [x] Rewrite README with stack overview, env setup, run/build/test scripts, deployment steps, and troubleshooting.
2. [ ] Document local profile storage format, backup instructions, and any optional server components.
3. [x] Capture AI prompt templates + best practices for future tuning.
4. [x] Provide release checklist and future work backlog.

## New Features Implemented (Recent Sprint)

### ✅ Recipe Detail & Regeneration System

- [x] Create `RecipePage` component with full recipe display
- [x] Implement ingredient exclusion with checkboxes
- [x] AI respects excluded ingredients when regenerating
- [x] `replaceRecipe` store action preserves meal plan integrity
- [x] Validation ensures recipe belongs to a meal plan before regeneration
- [x] Clear excluded ingredients after successful regeneration

### ✅ UI/UX Improvements

- [x] Unified color palette to `surface-*` across all pages
- [x] Enhanced Card components with hover effects and transitions
- [x] Loading skeleton screens for better perceived performance
- [x] Toast notification system for user feedback
- [x] Accessibility improvements (ARIA labels, keyboard navigation, touch targets)

### ✅ Navigation & Routing

- [x] Add `/recipe/:recipeId` route
- [x] Make recipe names clickable in MealPlanPage
- [x] Make recipe names clickable in FavoritesPage
- [x] Proper back navigation support

## Next Immediate Actions

1. [ ] Complete Phase 2: Local profile onboarding + storage refactor
2. [ ] Implement Phase 3: Guest mode enhancements
3. [ ] Complete Phase 7: Shopping list cost estimates and export options
4. [ ] Add tests and deployment configuration (Phase 9)

## Current Status

- **Core AI Meal Planning**: ✅ Functional
- **Recipe Detail View**: ✅ Complete
- **Ingredient Exclusion Regeneration**: ✅ Complete
- **Favorites System**: ✅ Functional
- **UI/UX Polish**: ✅ Substantially improved
- **Testing**: ❌ Pending
- **Deployment**: ❌ Pending

## Known Gaps & Blocking Issues

### 🔴 Critical for Production

- **No Netlify functions proxy** → Phase 6, task 3: API keys exposed to client
- **No automated tests** → Phase 9, tasks 1-3: Zero test coverage, no CI/CD
- **No profile isolation** → Phase 2, tasks 1-4: All users share single localStorage bucket

### 🟡 Important for MVP

- **No Google Calendar sync** → Phase 5, task 2: Missing calendar integration
- **No shopping list exports** → Phase 7, task 4: Cannot print or share shopping lists
- **No cost estimation** → Phase 7, task 2: No price tracking for ingredients
- **No diner selection** → Phase 4, task 2: Cannot assign who eats which meal

### 🟢 Nice-to-Have

- **No guest mode CTA** → Phase 3, task 1: Guest users not encouraged to save
- **No prompt customization** → Phase 8, task 2: AI prompts not configurable
- **Incomplete storage docs** → Phase 10, task 2: Backup/restore instructions missing

### 📋 Quick Reference Table

| Gap                      | Phase    | Task # | Priority        |
| ------------------------ | -------- | ------ | --------------- |
| Profile onboarding       | Phase 2  | 1      | 🔴 Critical     |
| Isolated localStorage    | Phase 2  | 2      | 🔴 Critical     |
| Profile management UI    | Phase 2  | 3      | 🔴 Critical     |
| Netlify proxy functions  | Phase 6  | 3      | 🔴 Critical     |
| Unit/integration tests   | Phase 9  | 1      | 🔴 Critical     |
| CI/CD pipeline           | Phase 9  | 4      | 🔴 Critical     |
| Google Calendar sync     | Phase 5  | 2      | 🟡 Important    |
| Shopping list costs      | Phase 7  | 2      | 🟡 Important    |
| Export shopping list     | Phase 7  | 4      | 🟡 Important    |
| Multi-device sync notes  | Phase 7  | 3      | 🟡 Important    |
| Diner selection per meal | Phase 4  | 2      | 🟡 Important    |
| Guest mode CTA           | Phase 3  | 1      | 🟢 Nice-to-have |
| Prompt customization     | Phase 8  | 2      | 🟢 Nice-to-have |
| Storage format docs      | Phase 10 | 2      | 🟢 Nice-to-have |

---

## Current Status

- **Core AI Meal Planning**: ✅ Functional
- **Recipe Detail View**: ✅ Complete
- **Ingredient Exclusion Regeneration**: ✅ Complete
- **Favorites System**: ✅ Functional
- **UI/UX Polish**: ✅ Substantially improved
- **Testing**: ❌ Pending
- **Deployment**: ❌ Pending
