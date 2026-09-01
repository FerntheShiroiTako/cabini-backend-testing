import { Hono } from 'hono'
import { requireUser } from './session'
import type { App } from './types'

const MAX_NAME = 32

const me = new Hono<App>()

me.get('/', (c) => {
  const user = c.get('user')
  if (!user) return c.json({ user: null, turnstileSiteKey: c.env.TURNSTILE_SITE_KEY })

  return c.json({
    user: {
      id: user.id,
      name: user.display_name ?? user.username,
      username: user.username,
      displayName: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      isOwner: c.get('isOwner'),
    },
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
  })
})

me.get('/posts', requireUser, async (c) => {
  const user = c.get('user')!
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, description, r2_key, status, created_at, reviewed_at
     FROM posts
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`
  ).bind(user.id).all()

  return c.json({ posts: results })
})

me.post('/name', requireUser, async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ displayName?: unknown }>().catch(() => ({ displayName: undefined }))

  if (typeof body.displayName !== 'string') {
    return c.json({ error: 'displayName must be a string' }, 400)
  }

  const trimmed = body.displayName.trim()

  if (trimmed.length > MAX_NAME) {
    return c.json({ error: `display name must be ${MAX_NAME} characters or fewer` }, 400)
  }

  const hasControlChars = [...trimmed].some((ch) => {
    const code = ch.codePointAt(0) ?? 0
    return code < 0x20 || code === 0x7f
  })

  if (hasControlChars) {
    return c.json({ error: 'display name contains invalid characters' }, 400)
  }

  const next = trimmed.length === 0 ? null : trimmed
  await c.env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(next, user.id).run()

  return c.json({ ok: true, name: next ?? user.username, displayName: next })
})

export default me
