# pmndrs/claude-code-plugin

A [Claude Code plugin](https://code.claude.com/docs/en/plugins) for
[Poimandres](https://github.com/pmndrs).

Generalist on purpose: it is not tied to one library. Anything that makes
Claude work better across the pmndrs repos — agents, skills, commands, MCP
servers — belongs here. What it actually carries is still being defined.

## Contents

Nothing yet — the manifests, the license and the agent-facing docs, and that
is deliberate. Components land as `agents/`, `skills/`, `commands/` and
`.mcp.json` once we agree on what the plugin is for.

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

## License

MIT
