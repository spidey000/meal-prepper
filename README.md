# AI Family Meal Planner

An opinionated Vite + React + TypeScript application that automates family meal planning, recipe generation, and grocery lists using OpenRouter-powered AI. Everything runs locally in the browser under a username you choose—no remote accounts or Supabase project required.

## Tech stack

- **Frontend**: React 19, React Router 7, TailwindCSS 3, Zustand, React Query
- **Local persistence**: Browser storage powered by Zustand profiles keyed by username
- **AI provider**: [OpenRouter](https://openrouter.ai) with Claude 3.5 Sonnet as the default model
- **Optional backend**: Netlify Functions (AI proxy hooks) when you don't want to expose API keys to the client

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
```

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


## AI debug logging

The app now includes structured, verbose AI logging in `src/services/aiDebug.ts` and integrates it across AI call flows in `src/services/mealAI.ts` and model discovery in `src/services/openrouter.ts`.

### Toggle verbose logs

You can control browser-console verbosity with either option below (first match wins):

1. `VITE_AI_VERBOSE_LOGGING=true|false`
2. Runtime override: `localStorage.setItem('ai:debug:verbose', 'true')` (or `'false'`)
3. Default fallback: enabled in `import.meta.env.DEV`, disabled in production

### Log categories and format

Logs are emitted with ISO timestamps and a consistent prefix:

- `[AI Call]` request + response payload/status
- `[AI Performance]` duration metrics for each AI request
- `[AI Error]` severity (`INFO`, `WARN`, `ERROR`), source function, message, and stack when available
- `[AI Config]` model/provider settings and JSON-response capability snapshots

Example output shape:

```text
2026-01-01T00:00:00.000Z [AI Call] [INFO] [Function: callAI.openrouter] Request Sent {...}
2026-01-01T00:00:00.150Z [AI Call] [INFO] [Function: callAI.openrouter] Response Received: status=200 duration=150.20ms {...}
2026-01-01T00:00:00.151Z [AI Performance] [INFO] [Function: callAI.openrouter] Request Processing Time: 150.20ms
2026-01-01T00:00:00.152Z [AI Config] [INFO] [Function: MealPlanPage.init] Configuration snapshot {...}
```

AI configuration snapshots are logged on Meal Plan initialization and whenever relevant AI settings are updated.

## Deployment checklist

1. Push main to GitHub so Netlify can build automatically
2. Configure Netlify environment variables (OpenRouter + any custom function secrets)
3. Enable Netlify Functions directory (`netlify/functions`) if you proxy AI calls
4. Point your domain (Netlify + Cloudflare) and enable HTTPS

Happy cooking!