import { Hono } from 'hono'
import { session } from './session'
import auth from './auth'
import posts from './posts'
import admin from './admin'
import owner from './owner'
import me from './me'
import type { App } from './types'

const app = new Hono<App>()

app.use('*', session)

app.route('/auth', auth)
app.route('/api/posts', posts)
app.route('/api/admin', admin)
app.route('/api/owner', owner)
app.route('/api/me', me)

app.get('/upload', async (c) => {
  const res = await c.env.ASSETS.fetch(new Request(new URL('/upload', c.req.url)))
  return new HTMLRewriter()
    .on('#ts-widget', {
      element(el) {
        el.setAttribute('data-sitekey', c.env.TURNSTILE_SITE_KEY)
      },
    })
    .transform(res)
})

app.get('/art/:key{.+}', async (c) => {
  const key = `art/${c.req.param('key')}`
  const user = c.get('user')

  const row = await c.env.DB.prepare('SELECT status FROM posts WHERE r2_key = ?')
    .bind(key).first<{ status: string }>()

  if (!row) return c.notFound()
  if (row.status !== 'approved' && user?.role !== 'moderator' && !c.get('isOwner')) return c.notFound()

  const object = await c.env.ART.get(key)
  if (!object) return c.notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', row.status === 'approved' ? 'public, max-age=31536000, immutable' : 'private, no-store')
  return new Response(object.body, { headers })
})

app.notFound((c) => c.env.ASSETS.fetch(c.req.raw))

export default app
