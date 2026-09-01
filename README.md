# CABSITE

Static site plus fanart gallery backend, one Cloudflare Worker.

Static pages live in `public/` and are served by Workers Assets. The Worker
handles `/auth/*`, `/api/*` and `/art/*`.

Full setup and deployment steps are in `docs/CABSITE-Setup.pdf`.

## Local development

```bash
npm install
npm run db:init
npm run dev
```

`wrangler dev` simulates D1, KV and R2 locally. Nothing is created on the
account and nothing is billed. Reset everything with `rm -rf .wrangler/state`,
then re-run `npm run db:init`.

Local secrets go in `.dev.vars` (gitignored):

```
DISCORD_CLIENT_SECRET=...
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
COOKIE_SECRET=...
```

`1x0000...AA` is Cloudflare's always-passes Turnstile test secret, paired with
site key `1x00000000000000000000AA` in `wrangler.jsonc`. Swap in
`2x0000000000000000000000000000000AA` to test the failure path.

## Production secrets

```bash
npx wrangler secret put DISCORD_CLIENT_SECRET
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put COOKIE_SECRET
```

`DISCORD_CLIENT_ID`, `DISCORD_REDIRECT_URI`, `TURNSTILE_SITE_KEY` and
`OWNER_DISCORD_ID` are public and live in `wrangler.jsonc` under `vars`.

## Roles

Everyone signs in as `member`. Moderators are appointed by the owner on the
Staff page at `/owner`.

The owner is whoever's Discord ID matches `OWNER_DISCORD_ID` in
`wrangler.jsonc`. It is config, not a database role, so it cannot be granted by
editing D1, and it still works on an empty database, which is how the first
moderator gets appointed. The owner also passes every moderator check.

To promote someone without the web page:

```bash
npx wrangler d1 execute cabsite-dev --local --command "UPDATE users SET role='moderator' WHERE username='NAME';"
```

Drop `--local` and use the production database name to promote for real.

## Routes

| Route | Auth | Behaviour |
|---|---|---|
| `GET /auth/discord` | none | Redirect to Discord |
| `GET /auth/callback` | none | Exchange code, upsert user, start session |
| `POST /auth/logout` | none | Clear session |
| `GET /api/me` | none | Current user, role and owner flag |
| `GET /api/posts` | none | Approved posts |
| `POST /api/posts` | session | Turnstile, then store as `pending` |
| `GET /api/admin/posts` | moderator | Pending queue |
| `POST /api/admin/posts/:id/approve` | moderator | Publish |
| `DELETE /api/admin/posts/:id` | moderator | Delete row and R2 object |
| `GET /api/owner/users` | owner | All accounts and roles |
| `POST /api/owner/users/:id/role` | owner | Promote or demote |
| `GET /art/*` | none | Approved images; staff also see pending |

Uploads are capped at 5MB and must be png, jpeg, gif or webp, checked by magic
bytes rather than the declared content type.
