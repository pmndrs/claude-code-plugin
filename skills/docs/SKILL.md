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

Only four libraries are actually served: `react-three-fiber`, `drei`, `zustand`, and
`docs` (the generator itself). Names are case-sensitive.

The tool's `lib` enum also advertises `a11y`, `react-postprocessing`, `uikit`, `xr`,
`prai`, `viverse` and `leva`, but their sites publish no `llms-full.txt`, so every
call fails and every index comes back empty. Don't route those through the MCP — use
WebFetch on their docs site. Fix in flight: pmndrs/docs#555.

## Budget

Pages run 1,200–4,000 tokens each. Fetch the one page that answers the question. If
three or more look relevant, read the index titles first and narrow — don't fetch the
set and sort it out afterwards.
