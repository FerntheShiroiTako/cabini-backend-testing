import { createMiddleware } from 'hono/factory'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { sign, unsign } from './cookie'
import type { App, User } from './types'

const COOKIE_NAME = 'cabsid'
const TTL_SECONDS = 60 * 60 * 24 * 7

export async function createSession(c: Context<App>, userId: string): Promise<void> {
  const sid = crypto.randomUUID()
  await c.env.SESSIONS.put(`session:${sid}`, userId, { expirationTtl: TTL_SECONDS })
  setCookie(c, COOKIE_NAME, await sign(sid, c.env.COOKIE_SECRET), {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: TTL_SECONDS,
  })
}

export async function destroySession(c: Context<App>): Promise<void> {
  const raw = getCookie(c, COOKIE_NAME)
  if (raw) {
    const sid = await unsign(raw, c.env.COOKIE_SECRET)
    if (sid) await c.env.SESSIONS.delete(`session:${sid}`)
  }
  deleteCookie(c, COOKIE_NAME, { path: '/' })
}

export const session = createMiddleware<App>(async (c, next) => {
  c.set('user', null)
  c.set('isOwner', false)
  const raw = getCookie(c, COOKIE_NAME)
  if (raw) {
    const sid = await unsign(raw, c.env.COOKIE_SECRET)
    if (sid) {
      const userId = await c.env.SESSIONS.get(`session:${sid}`)
      if (userId) {
        const user = await c.env.DB.prepare(
          'SELECT id, discord_id, username, display_name, avatar_url, role FROM users WHERE id = ?'
        ).bind(userId).first<User>()
        if (user) {
          c.set('user', user)
          c.set('isOwner', user.discord_id === c.env.OWNER_DISCORD_ID)
        }
      }
    }
  }
  await next()
})

export const requireUser = createMiddleware<App>(async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'not signed in' }, 401)
  await next()
})

export const requireModerator = createMiddleware<App>(async (c, next) => {
  const user = c.get('user')
  if (!user) return c.json({ error: 'not signed in' }, 401)
  if (user.role !== 'moderator' && !c.get('isOwner')) return c.json({ error: 'moderators only' }, 403)
  await next()
})

export const requireOwner = createMiddleware<App>(async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'not signed in' }, 401)
  if (!c.get('isOwner')) return c.json({ error: 'owner only' }, 403)
  await next()
})
