# pmnd — setup

An [eve](https://eve.dev) agent reachable from the Poimandres Discord with
`@pmnd hey`.

## Discord application

| | |
|---|---|
| App | **pmnd** — `1535916234330079292` |
| Portal | https://discord.com/developers/applications/1535916234330079292 |
| Owner | personal Discord account (move it to a Discord *Team* if pmndrs should own it) |
| Message Content Intent | enabled — required, regular messages never reach a bot without it |
| Interactions Endpoint URL | left unset on purpose; the Gateway feeds `/eve/v1/discord` |

Credentials live in `.env.local` (gitignored): `DISCORD_APPLICATION_ID`,
`DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`.

## Invite the bot (needs a pmndrs admin)

A server admin — anyone with *Manage Server* on `740090768164651008` — opens:

```
https://discord.com/oauth2/authorize?client_id=1535916234330079292&scope=bot%20applications.commands&permissions=326417615936
```

`326417615936` grants exactly: View Channel, Send Messages, Send Messages in
Threads, Create Public Threads, Manage Threads, Read Message History, Add
Reactions, Attach Files.

## Restrict where it answers

The bot ignores every channel outside `DISCORD_ALLOWED_CHANNEL_IDS`, and an
empty list means it stays silent everywhere — a public server would otherwise
let anyone spend AI Gateway credits.

Currently set to `740094974187798609` (#poimandres), locally and in the Vercel
production environment.

To collect ids: Discord ▸ Settings ▸ Advanced ▸ Developer Mode, then
right-click a channel ▸ *Copy Channel ID*. Set them comma-separated in
`.env.local` and in the Vercel project's environment.

## How `@pmnd hey` reaches the agent

Discord delivers regular messages only over the Gateway WebSocket, never
through HTTP Interactions. So `agent/schedules/discord-gateway.ts` runs every 4
minutes and holds a Gateway connection for 280s, forwarding events to the
channel's own webhook at `POST /eve/v1/discord`. The ~40s overlap is what keeps
mentions from falling into a gap between runs.

Those two numbers are set by Vercel's 300s function timeout, not by Discord. If
the project's max duration is raised, both can grow (e.g. 800s held, cron every
12 minutes) — which is cheaper, since each run is a billed invocation.

That forward is the deployment calling itself, so Deployment Protection answers
it with a 401 unless the request carries the automation bypass. The schedule
appends `?x-vercel-protection-bypass=$VERCEL_AUTOMATION_BYPASS_SECRET` (a
project-level secret under Settings ▸ Deployment Protection, exposed to the
runtime as a system env var). Protection stays on for everyone else. Worth
knowing when debugging: a 401 here is invisible from the outside — the Gateway
listener stays connected and simply drops every event.

## Documentation lookups

`agent/connections/pmndrs.ts` points the agent at the public docs MCP server,
https://docs.pmnd.rs/api/mcp — no auth, one tool, `pmndrs__get_page_content`.

That tool needs an exact page path, and the server publishes its page lists as
MCP *resources* (`docs://<lib>/index`) — which eve does not surface, since MCP
connections expose tools only. So `agent/tools/pmndrs_docs_index.ts` reads that
resource over the same endpoint by hand, and `agent/instructions.md` tells the
agent to call it before fetching a page. Drop it the day eve exposes MCP
resources.

The server advertises eleven libraries but serves only four —
react-three-fiber, drei, zustand, docs. The other seven have no
`llms-full.txt` upstream, so both their index and every page fetch fail. The
tool's enum is restricted to the working four; widen it if those dumps appear.

## Deployment

Linked to **pmndrs/pmnd** → https://pmnd-pmndrs.vercel.app. Redeploy with
`npx eve deploy`. Thread subscriptions and inbound dedupe live in the
`pmnd-redis` Upstash resource (`REDIS_URL`); without it the channel silently
falls back to in-memory state and loses subscriptions on every cold start.

## Still to do

- [x] Fill `DISCORD_ALLOWED_CHANNEL_IDS` — `740094974187798609` (#poimandres),
      local and production, deployed
- [ ] **Invite the bot to the server** (needs an admin) — see the URL above.
      Nothing else can be tested until this happens.
- [ ] Give `agent/instructions.md` a real job once pmnd's role is settled

To widen the allowlist later: `vercel env rm DISCORD_ALLOWED_CHANNEL_IDS
production`, add it back with the new comma-separated list, mirror it in
`.env.local`, then `npx eve deploy`.
