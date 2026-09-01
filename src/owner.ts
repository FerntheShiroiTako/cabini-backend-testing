import { Hono } from 'hono'
import { requireOwner } from './session'
import type { App } from './types'

const owner = new Hono<App>()

owner.use('*', requireOwner)

owner.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.discord_id, u.username, u.display_name, u.avatar_url, u.role, u.created_at,
            COUNT(p.id) AS post_count
     FROM users u
     LEFT JOIN posts p ON p.user_id = u.id
     GROUP BY u.id
     ORDER BY u.role DESC, u.username ASC`
  ).all()
  return c.json({ users: results, ownerDiscordId: c.env.OWNER_DISCORD_ID })
})

owner.post('/users/:id/role', async (c) => {
  const id = c.req.param('id')
  const { role } = await c.req.json<{ role: string }>().catch(() => ({ role: '' }))

  if (role !== 'member' && role !== 'moderator') {
    return c.json({ error: 'role must be member or moderator' }, 400)
  }

  const target = await c.env.DB.prepare('SELECT discord_id FROM users WHERE id = ?')
    .bind(id).first<{ discord_id: string }>()

  if (!target) return c.json({ error: 'no user with that id' }, 404)
  if (target.discord_id === c.env.OWNER_DISCORD_ID) {
    return c.json({ error: 'the owner role is set in config, not here' }, 400)
  }

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run()
  return c.json({ ok: true, role })
})

export default owner
