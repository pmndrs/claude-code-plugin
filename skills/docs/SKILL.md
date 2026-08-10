---
name: docs
description: Look up the official pmndrs documentation before answering anything about react-three-fiber (R3F), drei, or zustand — hooks, components, props, signatures, store patterns, migrations. Use it whenever code or an answer depends on one of these APIs, rather than recalling the API from memory.
---

# pmndrs docs

These libraries move, and a plausible-looking API you half-remember is worse
than a slow answer. Read the page, then answer.

The plugin ships one MCP server, `docs` — the public
[docs.pmnd.rs](https://docs.pmnd.rs/api/mcp) server, no auth. It exposes page
indexes as MCP *resources* and one tool, `get_page_content(lib, path)`.

## How to look something up

1. **Read the index resource** for the library: `docs://<lib>/index`, via
   `ReadMcpResourceTool`. It returns one `<path> - <title>` line per page.
   Installed as a plugin, the server registers under the scoped name
   `plugin:pmndrs:docs` rather than the bare key `docs` — pass that as `server`.
   `ListMcpResourcesTool` with no argument shows the live name and which server
   serves the `docs://` URIs.
2. **Fetch the page** with this plugin's `get_page_content`, passing a `path`
   copied verbatim from that index and the same `lib`.
3. Quote the doc when an exact signature or prop name matters, and link the
   page: `https://docs.pmnd.rs/<lib><path>`.

Paths are not guessable and the server does not redirect — an invented path is
just a "page not found". Always go through the index. Library names are
case-sensitive.

Indexes are small (16–134 lines); reading one is cheap and usually enough to
tell whether the docs cover the question at all.

## When to hand it off

Do the lookup inline by default. One index plus one page is smaller than the
round trip through another agent, and quoting from a page you read yourself is
more faithful than quoting a summary of it.

Hand off to the `docs-lookup` agent when the reading is wide: three or more
pages, or two or more libraries in one question — a drei helper plus the R3F
hook it wraps plus the zustand store behind them. There the index listings and
page bodies would crowd out the code you are actually working on, and the agent
reads them in its own context and reports back.

Whatever it reports is a doc quote, not an answer: check it still addresses the
question, and keep its links.

## What the server actually serves

Four libraries, despite the eleven its tool schema advertises:

| `lib`                | Pages | Covers |
|----------------------|-------|--------|
| `react-three-fiber`  | 20    | R3F — canvas, hooks, events, performance |
| `drei`               | 134   | drei helpers, one page per helper |
| `zustand`            | 42    | zustand — `create`, middleware, TypeScript, migrations |
| `docs`               | 16    | the pmndrs/docs site generator itself |

The other seven — `a11y`, `react-postprocessing`, `uikit`, `xr`, `prai`,
`viverse`, `leva` — are listed by the server but publish no `llms-full.txt`
upstream, so their index is empty and every page fetch fails (checked
2026-08-09). Don't retry them: answer from what you know, say the answer is
from memory rather than from the docs, and point at the GitHub repo
(`https://github.com/pmndrs/<lib>`). Re-read `docs://<lib>/index` before
assuming that's still true.

Nothing here covers jotai, valtio, or the rest of the pmndrs state libraries —
same rule as the seven above.

## Notes

- `docs://pmndrs/manifest` documents the server itself; read it if something
  behaves unexpectedly.
- Content is cached ~5 minutes server-side, so a just-published docs change may
  lag.
