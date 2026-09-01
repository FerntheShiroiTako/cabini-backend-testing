# CABSITE Backend — Agent Handoff

## Context

CABSITE is a static multi-page HTML/CSS site for the group CAB, already deployed as a Cloudflare Worker from a git-linked repo (`cab-website`, GitHub user `FerntheShiroiTako`). Header and footer are synced across pages by a JS fetch in `nav.js`.

This work adds a backend to that same Worker. Scope:

- Users sign in and get an account
- Signed-in users post fanart to a gallery page
- Users with a moderator role get an admin panel to approve or reject submissions

Nothing publishes without a moderator approving it.

## Decisions already made

| Decision | Rationale |
|---|---|
| TypeScript, not PHP | Workers run on V8 isolates — JS/TS/WASM only. PHP would require moving the backend to the existing DigitalOcean droplet, adding a second deploy target, CORS, and server ops. PHP would also be a new language for the owner, so TS costs one new thing instead of three. |
| TypeScript, not Python | Python Workers are still open beta behind a compat flag. Not appropriate for a user-facing service. |
| Hono as the router | De facto Workers framework, Express-style routing and middleware. |
| Single Worker, single deploy | Backend lives in the same Worker that already serves the static pages. No second origin, no CORS. |
| Discord OAuth for login | CAB already runs on Discord. No password storage, no reset flow, and Discord identity is meaningful to the community. |
| D1 for relational data, R2 for image files | D1 is on the free plan; R2 has zero egress fees, which dominates cost for an image gallery. |
| KV for sessions | Avoids a D1 read on every request. |
| Turnstile on the upload route | Free bot protection. Necessary because the mod queue is the only throttle. |
| Rejected posts are deleted, not archived | No third status. Removes the D1 row and the R2 object. |
| AI moderation deferred | Considered and understood, not in scope for v1. See "Deferred" below. |

## Non-goals for v1

- No AI moderation
- No comments, likes, or follows
- No email — Discord identity only
- No auto-publishing of any kind
- Do not move any part of this to the droplet

## Architecture

Browser → Worker (Hono) → D1 / R2 / KV. The browser never touches storage directly.

Layers:

1. **Browser** — gallery page, upload form, admin panel, login button
2. **Worker** — static asset serving, `/auth/*`, `/api/posts`, `/api/admin/*`, session middleware
3. **Pipeline** — Turnstile check → `pending` → mod decision → `approved` or deleted
4. **Storage** — KV (sessions), D1 (users, posts, roles), R2 (image files)

External services: Discord OAuth, Turnstile.

## Data model

```
users
  id, discord_id, username, avatar_url, role, created_at

posts
  id, user_id, title, description, r2_key, status, created_at, reviewed_by, reviewed_at
```

- `users.role` — `member` or `moderator`
- `posts.status` — `pending` or `approved`
- Sessions live in KV, not D1: key is the session id, value is the user id, with a TTL

## Routes

| Route | Auth | Behaviour |
|---|---|---|
| `GET /auth/discord` | none | Redirect to Discord |
| `GET /auth/callback` | none | Exchange code, upsert user with `role = member`, write KV session, set signed cookie |
| `GET /api/posts` | none | List posts where `status = approved` |
| `POST /api/posts` | session required | Verify Turnstile, write R2 object, insert D1 row with `status = pending` |
| `GET /api/admin/posts` | `role = moderator` | List posts where `status = pending` |
| `POST /api/admin/posts/:id/approve` | `role = moderator` | Set `status = approved`, record `reviewed_by` and `reviewed_at` |
| `DELETE /api/admin/posts/:id` | `role = moderator` | Delete the D1 row and the R2 object |

Session middleware reads the signed cookie, resolves the session in KV, and loads the role from D1. The admin guard is a role check on top of that. Alternative considered: put `/admin` behind Cloudflare Access (free up to 50 users) so unauthenticated requests never reach Worker code.

## Local development

`wrangler dev` simulates D1, KV and R2 locally by default. No account resources are created and nothing is billed. This specifically avoids having to enable R2 on the dashboard, which is the one product that asks for billing details up front.

```bash
npx wrangler dev
npx wrangler d1 execute cabsite-dev --local --file=./schema.sql
```

Bindings — IDs are placeholders as far as local mode is concerned:

```jsonc
{
  "d1_databases": [
    { "binding": "DB", "database_name": "cabsite-dev", "database_id": "local" }
  ],
  "kv_namespaces": [
    { "binding": "SESSIONS", "id": "local" }
  ],
  "r2_buckets": [
    { "binding": "ART", "bucket_name": "cabsite-art" }
  ]
}
```

Local state lives in `.wrangler/state`. Local D1 is a real SQLite file and can be opened directly. `rm -rf .wrangler/state` resets everything.

To test against real services later, add `"remote": true` to one binding at a time.

## Conventions and constraints

- **`.wrangler/` must be in `.gitignore`** before the first commit, or the test database and uploaded test images get pushed to `cab-website`.
- The owner's stated preference: **no explanatory comments in code**. Omit `//`, `/* */` and equivalents.
- Communication style: casual, direct, technically precise.
- Do not break the existing `nav.js` header/footer fetch pattern or the existing static page structure.
- Secrets (Discord client secret, Turnstile secret, cookie signing key) go in `wrangler secret`, never in the repo or in `wrangler.jsonc`.

## Costs

Free to start. Workers free tier is 100k requests/day; Workers Paid is $5/month. R2 gives 10 GB storage free then $0.015/GB-month, with egress always free. D1, KV and Turnstile are covered on the free plan.

## Deferred: AI moderation

Understood and priced, deliberately not in v1. If added later it slots in between the Turnstile check and the D1 insert:

- Workers AI vision model returns a JSON verdict on upload
- Billed in neurons at $0.011 per 1,000, with 10,000 neurons/day free
- **The model must never auto-reject.** It may only auto-approve or defer to the mod queue.
- Downscale to roughly 512px for the moderation call. Store the original in R2, moderate the copy.

## Open questions

- Whether to gate `/admin` with Cloudflare Access instead of an in-code role check
- Whether moderator role is assigned manually in D1 or derived from a Discord role
- File size and format limits on upload
