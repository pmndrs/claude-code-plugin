# pmndrs — a Claude Code plugin

The Poimandres plugin for Claude Code: one install that carries whatever makes
Claude work well on a pmndrs codebase.

That is a shape, not a promise. Today it does one thing — it makes Claude read
the [pmndrs docs](https://docs.pmnd.rs) before answering questions about
**react-three-fiber**, **drei** and **zustand**, instead of recalling an API
that may have moved. What lands next is whatever earns its place: more skills,
subagents, hooks. They land here rather than in a plugin each, so that adopting
Poimandres tooling stays one install and one thing to keep current.

## Install

```bash
claude plugin marketplace add pmndrs/claude-code-plugin
claude plugin install pmndrs@pmndrs
```

Or from inside a session: `/plugin marketplace add pmndrs/claude-code-plugin`, then
`/plugin install pmndrs@pmndrs`.

The plugin bundles an MCP server, so Claude Code asks you to approve it on
first use. It is the public docs.pmnd.rs endpoint — no auth, no credentials.

## Documentation lookup

Nothing to invoke. Ask normally:

> How do I pause the render loop in R3F?

and Claude reads the docs index, fetches the page, and answers with a link.
`/pmndrs:docs` runs the same lookup on demand.

A question that spans several pages — a drei helper, the R3F hook under it, and
the zustand store behind that — goes to the `pmndrs:docs-lookup` agent instead,
which reads the pages in its own context and reports back the signatures. One
page stays inline: the round trip costs more than the index it would save.

The docs server advertises eleven libraries but only serves four —
react-three-fiber, drei, zustand, and the pmndrs/docs site itself. The other
seven (a11y, react-postprocessing, uikit, xr, prai, viverse, leva) publish no
`llms-full.txt` upstream, so the skill tells Claude to say so rather than
retry. Widen it the day those dumps appear.

## What's inside

Components, which is what grows:

| | |
|---|---|
| `skills/docs/SKILL.md` | when to look things up, and how — index resource first, then `get_page_content` |
| `agents/docs-lookup.md` | the read-only subagent for wide lookups; quotes pages verbatim, cannot edit files |

And the plumbing, which mostly doesn't:

| | |
|---|---|
| `.mcp.json` | the `docs` MCP server → `https://docs.pmnd.rs/api/mcp` |
| `.claude-plugin/plugin.json` | the plugin manifest |
| `.claude-plugin/marketplace.json` | lets this repo be added as a marketplace |
| `test/` | checks the components are wired to the manifests |

## Develop

```bash
claude --plugin-dir .        # load this checkout directly
claude plugin validate .     # check the manifests
npm test                     # check the components (no dependencies)
```

`/reload-plugins` picks up edits without restarting; `SKILL.md` changes apply
immediately.

`npm test` runs Node's built-in test runner over `test/` — no install step. It
checks the things that fail silently at runtime rather than loudly at load: that
a component addressing a bundled MCP server uses the scoped name it registers
under once installed, that the plugin name still matches between the two
manifests it is derived from, that no server is declared and then used by
nothing, that an agent's `tools` entries resolve to real tools, and that this
README lists every component shipped.

That last one is the rule to keep as components accumulate: a capability nobody
can find is a capability nobody uses, so the README table is enforced rather
than maintained by good intentions.
