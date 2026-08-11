---
name: docs
description: Look up the official pmndrs documentation before answering anything about react-three-fiber (R3F), drei, zustand, xr, uikit, react-postprocessing, a11y, leva, prai or viverse — hooks, components, props, signatures, store patterns, migrations. Use it whenever code or an answer depends on one of these APIs, rather than recalling the API from memory.
---

# pmndrs docs

The `pmndrs` MCP server serves the official docs from docs.pmnd.rs. Prefer it over
memory: these libraries move fast and recalled APIs go stale.

## Always index first

Never guess a page path — `get_page_content` only accepts paths that exist, and the
route shapes differ per library (`/api/hooks` for react-three-fiber, `/learn/guides/...`
for zustand, `/abstractions/...` for drei). Read the index resource, pick the path,
then fetch.

1. `ReadMcpResourceTool` on `docs://{lib}/index` — one `{path} - {title}` per line,
   200–1,300 tokens.
2. `mcp__pmndrs__get_page_content` with `lib` and the exact `path` from step 1.

`lib` is one of: `react-three-fiber`, `drei`, `zustand`, `a11y`,
`react-postprocessing`, `uikit`, `xr`, `docs`, `prai`, `viverse`, `leva`. Names are
case-sensitive.

## Budget

Pages run 1,200–4,000 tokens each. Fetch the one page that answers the question. If
three or more look relevant, read the index titles first and narrow — don't fetch the
set and sort it out afterwards.

## Known gaps

- `docs://pmndrs/manifest` is partly stale: it cites jotai and valtio (not served) and
  zustand paths under `/docs/...` that 404. Trust the per-library index, not the manifest.
- The `xr`, `uikit` and `leva` indexes currently return empty. Say so and fall back to
  WebFetch on docs.pmnd.rs rather than guessing paths.
- A bad path returns `MCP server error: Page not found: {path}` — re-read the index
  instead of retrying variants.
