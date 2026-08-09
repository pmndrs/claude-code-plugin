# pmndrs — a Claude Code plugin

Makes Claude read the [pmndrs docs](https://docs.pmnd.rs) before answering
questions about **react-three-fiber**, **drei** and **zustand**, instead of
recalling an API that may have moved.

## Install

```bash
claude plugin marketplace add pmndrs/claude-code-plugin
claude plugin install pmndrs@pmndrs
```

Or from inside a session: `/plugin marketplace add pmndrs/claude-code-plugin`, then
`/plugin install pmndrs@pmndrs`.

The plugin bundles an MCP server, so Claude Code asks you to approve it on
first use. It is the public docs.pmnd.rs endpoint — no auth, no credentials.

## Use

Nothing to invoke. Ask normally:

> How do I pause the render loop in R3F?

and Claude reads the docs index, fetches the page, and answers with a link.
`/pmndrs:docs` runs the same lookup on demand.

## What's inside

| File | |
|---|---|
| `.mcp.json` | the `docs` MCP server → `https://docs.pmnd.rs/api/mcp` |
| `skills/docs/SKILL.md` | when to look things up, and how — index resource first, then `get_page_content` |
| `.claude-plugin/plugin.json` | the plugin manifest |
| `.claude-plugin/marketplace.json` | lets this repo be added as a marketplace |

The docs server advertises eleven libraries but only serves four —
react-three-fiber, drei, zustand, and the pmndrs/docs site itself. The other
seven (a11y, react-postprocessing, uikit, xr, prai, viverse, leva) publish no
`llms-full.txt` upstream, so the skill tells Claude to say so rather than
retry. Widen it the day those dumps appear.

## Develop

```bash
claude --plugin-dir .        # load this checkout directly
claude plugin validate .     # check the manifests
```

`/reload-plugins` picks up edits without restarting; `SKILL.md` changes apply
immediately.
