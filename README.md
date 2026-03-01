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

## Deployment checklist

1. Push main to GitHub so Netlify can build automatically
2. Configure Netlify environment variables (OpenRouter + any custom function secrets)
3. Enable Netlify Functions directory (`netlify/functions`) if you proxy AI calls
4. Point your domain (Netlify + Cloudflare) and enable HTTPS

Happy cooking!