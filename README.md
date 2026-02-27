# AI Family Meal Planner

An opinionated Vite + React + TypeScript application that automates family meal planning, recipe generation, and grocery lists using OpenRouter-powered AI. Authenticated users can sync their data with Supabase, while guests keep everything in local storage.

## Tech stack

- **Frontend**: React 19, React Router 7, TailwindCSS 3, Zustand, React Query
- **Backend services**: Supabase (Auth + Postgres) and Netlify Functions (AI proxy hooks)
- **AI provider**: [OpenRouter](https://openrouter.ai) with Claude 3.5 Sonnet as the default model
- **State persistence**: Local storage for guest mode, Supabase tables for authenticated mode (family, schedules, recipes, shopping lists, settings)

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173. Vite automatically proxies API requests to local Netlify functions when you run `netlify dev` in another terminal.

### Required environment variables

Create a `.env` file based on `.env.example` (add this file) with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENROUTER_API_KEY= # optional fallback for guests
VITE_OPENROUTER_REFERRER=https://your-domain.com
VITE_OPENROUTER_TITLE=AI Family Meal Planner
```

Netlify Functions expect:

```
OPENROUTER_API_KEY= # service key used when user keys are stored server-side
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_AI_KEYS_TABLE=ai_api_keys
```

### Supabase schema outline

- `family_members`
- `weekly_schedules`
- `recipes`
- `daily_menus`
- `shopping_lists`
- `user_settings` (stores encrypted OpenRouter keys + cuisine prefs)
- `ai_api_keys` (optional table used by Netlify Functions)

Each table should enforce RLS with policies that scope rows to `auth.uid()`.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and create production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  app/                # Providers and auth contexts
  components/         # UI primitives + layout
  pages/              # Feature pages (Family, Schedule, Meal Plan, etc.)
  services/           # OpenRouter + AI helpers
  store/              # Zustand store with persistence
  types/              # Shared TypeScript models
netlify/functions/    # Serverless AI proxy endpoints (to be implemented)
```

## AI workflow

1. Gather family + schedule data
2. Generate weekly meal plan + recipe bundle via OpenRouter
3. Regenerate individual meals in context
4. Convert approved recipes into categorized shopping list

All AI calls run through `src/services/mealAI.ts`. You can swap models or providers in one place.

## Deployment checklist

1. Push main to GitHub so Netlify can build automatically
2. Configure Netlify environment variables (OpenRouter + Supabase)
3. Expose Supabase URL + anon key to the frontend via Vite env vars
4. Enable Netlify Functions directory (`netlify/functions`)
5. Point your domain (Netlify + Cloudflare) and enable HTTPS

Happy cooking!