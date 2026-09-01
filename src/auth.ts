import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { createSession, destroySession } from './session'
import type { App } from './types'

const STATE_COOKIE = 'cabstate'
const STATE_TTL = 1800
const AUTHORIZE = 'https://discord.com/oauth2/authorize'
const TOKEN = 'https://discord.com/api/oauth2/token'
const IDENTITY = 'https://discord.com/api/users/@me'

type DiscordUser = { id: string; username: string; avatar: string | null }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

function signInError(c: Context<App>, headline: string, detail: string) {
  console.error('sign in failed:', headline, '-', detail)
  return c.html(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sign in failed — The Cabini Shrine</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header><h1>SIGN IN FAILED</h1></header>
<section>
  <div class="card">
    <h2>${escapeHtml(headline)}</h2>
    <p>${escapeHtml(detail)}</p>
    <div class="actions">
      <a class="button button-primary" href="/auth/discord">Try again</a>
      <a class="button" href="/">Back to the shrine</a>
    </div>
  </div>
</section>
</body>
</html>`,
    400
  )
}

const auth = new Hono<App>()

auth.get('/discord', (c) => {
  const here = new URL(c.req.url).origin
  const configured = new URL(c.env.DISCORD_REDIRECT_URI).origin

  if (here !== configured) {
    return signInError(
      c,
      'This site and the Discord redirect do not match',
      `You are on ${here} but DISCORD_REDIRECT_URI points at ${configured}. Discord would send you back to a different origin, where the sign in cookie does not exist. Set DISCORD_REDIRECT_URI to ${here}/auth/callback, and add that exact URL to the Discord application's redirect list.`
    )
  }

  const state = crypto.randomUUID()
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: STATE_TTL,
  })
  const url = new URL(AUTHORIZE)
  url.searchParams.set('client_id', c.env.DISCORD_CLIENT_ID)
  url.searchParams.set('redirect_uri', c.env.DISCORD_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify')
  url.searchParams.set('state', state)
  return c.redirect(url.toString())
})

auth.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const denied = c.req.query('error')
  const expected = getCookie(c, STATE_COOKIE)
  deleteCookie(c, STATE_COOKIE, { path: '/' })

  if (denied) {
    return signInError(
      c,
      'Discord did not authorise the sign in',
      `Discord returned "${denied}". If you clicked Cancel this is expected.`
    )
  }

  if (!code || !state) {
    return signInError(
      c,
      'This page was opened directly',
      'Discord did not send a code, so there is nothing to complete. Start from the sign in button rather than opening this address yourself.'
    )
  }

  if (!expected) {
    return signInError(
      c,
      'The sign in cookie was missing',
      'It expires after 30 minutes, and it is dropped if your browser blocks cookies for this site. Start the sign in again and complete it without leaving it open too long.'
    )
  }

  if (state !== expected) {
    return signInError(
      c,
      'The sign in did not match',
      'This usually means sign in was started in another tab or window and a newer attempt replaced this one. Try again in a single tab.'
    )
  }

  const tokenRes = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: c.env.DISCORD_REDIRECT_URI,
    }),
  })
  if (!tokenRes.ok) return c.json({ error: 'token exchange failed' }, 502)
  const { access_token } = await tokenRes.json<{ access_token: string }>()

  const userRes = await fetch(IDENTITY, { headers: { Authorization: `Bearer ${access_token}` } })
  if (!userRes.ok) return c.json({ error: 'identity fetch failed' }, 502)
  const discord = await userRes.json<DiscordUser>()

  const avatar = discord.avatar
    ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png`
    : null

  const row = await c.env.DB.prepare(
    `INSERT INTO users (id, discord_id, username, avatar_url, role, created_at)
     VALUES (?, ?, ?, ?, 'member', ?)
     ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, avatar_url = excluded.avatar_url
     RETURNING id`
  ).bind(crypto.randomUUID(), discord.id, discord.username, avatar, new Date().toISOString())
    .first<{ id: string }>()

  if (!row) return c.json({ error: 'user upsert failed' }, 500)

  await createSession(c, row.id)
  return c.redirect('/gallery')
})

auth.post('/logout', async (c) => {
  await destroySession(c)
  return c.json({ ok: true })
})

export default auth
