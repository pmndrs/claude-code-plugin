# ✴︎ poimandrizing...

A [Claude Code plugin](https://code.claude.com/docs/en/plugins) for
[Poimandres](https://github.com/pmndrs).

Generalist on purpose: it is not tied to one library. Anything that makes
Claude work better across the pmndrs repos — agents, skills, commands, MCP
servers — belongs here. What it actually carries is still being defined.

## Contents

- **`.mcp.json`** — the `pmndrs` MCP server (`https://docs.pmnd.rs/api/mcp`),
  which serves the official docs for react-three-fiber, drei and zustand,
  plus the example gallery from `pmndrs.github.io/examples`.
- **`skills/docs`** — makes Claude actually reach for those docs instead of
  answering from memory, and teaches it to read a library index before
  fetching a page.
- **`skills/examples`** — sends Claude to a demo that already works before it
  writes a scene from scratch, and teaches it to pick one off the gallery
  index rather than fetching several and comparing.

More components land as `agents/` and `commands/` as we agree on what else
the plugin is for.

## Install

```
/plugin marketplace add pmndrs/claude-code-plugin
/plugin install pmndrs@pmndrs
```

## Update

The MCP server takes care of itself: pages are fetched at request time and
revalidated every five minutes, so docs published on `docs.pmnd.rs` reach you
without a redeploy on either side — see
[Agents › MCP server](https://pmndrs.github.io/docs/agents/introduction#mcp-server).

The plugin is a different matter. It carries no `version` in its manifest, so
Claude Code falls back to the source's commit SHA: every commit on `main` is a
new version, and there is nothing to tag or release. Users pull it with

```
/plugin marketplace update pmndrs
/plugin update pmndrs@pmndrs
```

or wait for the background refresh, which does the same on its own.

The alternative, should the plugin ever want a release cadence, is to put
`version` back in `.claude-plugin/plugin.json`: updates then only reach users
when that field is bumped, and pushing to `main` stops being enough.

## Develop

```
claude --plugin-dir /path/to/claude-code-plugin
```

Run `/reload-plugins` to pick up changes without restarting.

At the repo root both manifests are present, and `claude plugin validate .`
reads the marketplace one. Pass the plugin manifest explicitly to validate the
plugin itself:

```
claude plugin validate .
claude plugin validate .claude-plugin/plugin.json
```

## License

MIT
