import { Hono } from 'hono'
import { requireUser } from './session'
import { verifyTurnstile } from './turnstile'
import { detectImage, MAX_BYTES } from './image'
import type { App } from './types'

const posts = new Hono<App>()

posts.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.r2_key, p.created_at, COALESCE(u.display_name, u.username) AS username, u.avatar_url
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.status = 'approved'
     ORDER BY p.created_at DESC
     LIMIT 100`
  ).all()
  return c.json({ posts: results })
})

posts.post('/', requireUser, async (c) => {
  const user = c.get('user')!

  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return c.json({ error: 'expected multipart form data' }, 400)
  }

  const token = form.get('cf-turnstile-response')
  if (typeof token !== 'string' || !token) {
    return c.json({ error: 'no turnstile token was submitted' }, 400)
  }

  const ip = c.req.header('CF-Connecting-IP') ?? null
  const check = await verifyTurnstile(token, c.env.TURNSTILE_SECRET, ip)

  if (!check.success) {
    console.error('turnstile rejected upload', check.errorCodes)
    if (check.misconfigured) {
      return c.json({ error: 'turnstile is misconfigured on the server', codes: check.errorCodes }, 500)
    }
    return c.json({ error: 'turnstile rejected this token', codes: check.errorCodes }, 403)
  }

  const title = String(form.get('title') ?? '').trim()
  const description = String(form.get('description') ?? '').trim()
  const file = form.get('image')

  if (!title || title.length > 120) return c.json({ error: 'title must be 1-120 characters' }, 400)
  if (description.length > 1000) return c.json({ error: 'description must be under 1000 characters' }, 400)
  if (!(file instanceof File)) return c.json({ error: 'missing image' }, 400)
  if (file.size === 0) return c.json({ error: 'image is empty' }, 400)
  if (file.size > MAX_BYTES) return c.json({ error: 'image must be 5MB or smaller' }, 413)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = detectImage(bytes)
  if (!kind) return c.json({ error: 'image must be png, jpeg, gif or webp' }, 415)

  const id = crypto.randomUUID()
  const key = `art/${id}.${kind.ext}`

  await c.env.ART.put(key, bytes, { httpMetadata: { contentType: kind.mime } })

  try {
    await c.env.DB.prepare(
      `INSERT INTO posts (id, user_id, title, description, r2_key, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    ).bind(id, user.id, title, description || null, key, new Date().toISOString()).run()
  } catch (err) {
    await c.env.ART.delete(key)
    throw err
  }

  return c.json({ id, status: 'pending' }, 201)
})

export default posts
