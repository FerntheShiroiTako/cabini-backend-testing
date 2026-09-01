import { Hono } from 'hono'
import { requireModerator } from './session'
import type { App } from './types'

const admin = new Hono<App>()

admin.use('*', requireModerator)

admin.get('/posts', async (c) => {
  const status = c.req.query('status') ?? 'pending'
  if (status !== 'pending' && status !== 'approved') {
    return c.json({ error: 'status must be pending or approved' }, 400)
  }

  const order = status === 'pending' ? 'ASC' : 'DESC'
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.description, p.r2_key, p.created_at, COALESCE(u.display_name, u.username) AS username, u.avatar_url
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.status = ?
     ORDER BY p.created_at ${order}
     LIMIT 100`
  ).bind(status).all()
  return c.json({ posts: results })
})

admin.post('/posts/:id/approve', async (c) => {
  const user = c.get('user')!
  const result = await c.env.DB.prepare(
    `UPDATE posts SET status = 'approved', reviewed_by = ?, reviewed_at = ?
     WHERE id = ? AND status = 'pending'`
  ).bind(user.id, new Date().toISOString(), c.req.param('id')).run()

  if (result.meta.changes === 0) return c.json({ error: 'no pending post with that id' }, 404)
  return c.json({ ok: true })
})

admin.delete('/posts/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT r2_key FROM posts WHERE id = ?')
    .bind(id).first<{ r2_key: string }>()

  if (!row) return c.json({ error: 'no post with that id' }, 404)

  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
  await c.env.ART.delete(row.r2_key)

  return c.json({ ok: true })
})

export default admin
