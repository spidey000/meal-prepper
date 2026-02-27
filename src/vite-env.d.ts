/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_REFERRER?: string
  readonly VITE_OPENROUTER_TITLE?: string
  readonly VITE_AI_PROXY_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
