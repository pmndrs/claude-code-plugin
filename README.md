# pmndrs/claude-code-plugin

A [Claude Code plugin](https://code.claude.com/docs/en/plugins) for
[Poimandres](https://github.com/pmndrs).

Generalist on purpose: it is not tied to one library. Anything that makes
Claude work better across the pmndrs repos — agents, skills, commands, MCP
servers — belongs here. What it actually carries is still being defined.

## Contents

- **`.mcp.json`** — the `pmndrs` MCP server (`https://docs.pmnd.rs/api/mcp`),
  which serves the official docs for react-three-fiber, drei and zustand.
- **`skills/docs`** — makes Claude actually reach for those docs instead of
  answering from memory, and teaches it to read a library index before
  fetching a page.

More components land as `agents/` and `commands/` as we agree on what else
the plugin is for.

## Install

```
/plugin marketplace add pmndrs/claude-code-plugin
/plugin install pmndrs@pmndrs
```

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

There is no test suite: this repo is configuration and prose, and a check that
reads a file back to itself proves nothing. The two edits that break things
silently are written down in [AGENTS.md](AGENTS.md).

Whether `https://docs.pmnd.rs/api/mcp` serves what it claims is not this repo's
business — that belongs to [pmndrs/docs](https://github.com/pmndrs/docs), which
tests it there. The Coverage section of the skill records what was true when it was
written; when the server widens, widen the prose.

## License

MIT
