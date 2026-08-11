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

## Test

```
node --test
```

Offline checks over this repo's own files — no dependencies, no network, runs in
milliseconds. This is what CI gates pull requests on.

```
node --test scripts/check-docs-mcp.mjs
```

The live check against `https://docs.pmnd.rs/api/mcp`. It runs weekly rather than on
pull requests: it can only fail for reasons outside your patch, and it files an issue
when it does. What it catches is the server's coverage drifting away from what
`skills/docs/SKILL.md` claims — so it talks to the real server, since a mock would
keep passing through exactly that drift.

The claim itself lives in [`scripts/docs-coverage.mjs`](scripts/docs-coverage.mjs):
the offline suite pins the skill's prose to it, the live one pins it to reality.

## License

MIT
