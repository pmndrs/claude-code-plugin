---
name: docs
description: Look up the official pmndrs documentation before answering anything about react-three-fiber (R3F), drei or zustand — hooks, components, props, signatures, store patterns, migrations. Use it whenever code or an answer depends on one of these APIs, rather than recalling the API from memory.
---

# pmndrs docs

The `pmndrs` MCP server serves the official docs from docs.pmnd.rs. Prefer it over
memory: these libraries move fast and recalled APIs go stale.

## Always index first

Never guess a page path — `get_page_content` matches exactly, and route shapes differ
per library (`/api/hooks` for react-three-fiber, `/learn/guides/...` and
`/reference/apis/...` for zustand, `/abstractions/...` for drei). Read the index
resource, pick the path, then fetch.

1. `ReadMcpResourceTool` on `docs://{lib}/index` — one `{path} - {title}` per line,
   200–1,300 tokens.
2. `mcp__pmndrs__get_page_content` with `lib` and the exact `path` from step 1.

A bad path returns `MCP server error: Page not found: {path}` — re-read the index
instead of retrying variants.

## Coverage

Served — route these through the MCP: `react-three-fiber`, `drei`, `zustand`, `docs`
(the generator itself). Names are case-sensitive.

Anything else is unserved. The tool's `lib` enum advertises more libraries than that,
but the extra entries have no `llms-full.txt` behind them: every call fails and every
index comes back empty. Treat a library missing from the list above as absent, and use
WebFetch on its docs site. Fix in flight: pmndrs/docs#555.

## Budget

Pages run 1,200–4,000 tokens each. Fetch the one page that answers the question. If
three or more look relevant, read the index titles first and narrow — don't fetch the
set and sort it out afterwards.
