export type Env = {
  DB: D1Database
  SESSIONS: KVNamespace
  ART: R2Bucket
  ASSETS: Fetcher
  DISCORD_CLIENT_ID: string
  DISCORD_CLIENT_SECRET: string
  DISCORD_REDIRECT_URI: string
  TURNSTILE_SITE_KEY: string
  TURNSTILE_SECRET: string
  COOKIE_SECRET: string
  OWNER_DISCORD_ID: string
}

export type User = {
  id: string
  discord_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: 'member' | 'moderator'
}

export type Vars = {
  user: User | null
  isOwner: boolean
}

export type App = { Bindings: Env; Variables: Vars }
