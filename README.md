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
npm test
```

Four offline checks, and deliberately no more. This plugin is configuration and
prose — there is no code to unit-test, and asserting that a file contains what it
contains proves nothing. A test earns its place here only by pinning a relationship
*between* two files that nothing else enforces: the tool name in the skill against
the server key in `.mcp.json`, the skill's served list against `coverage.mts`, the
marketplace against the plugin manifest.

`vitest.config.mts` matches `*.test.mts` only, so this can never reach the network.
It is what CI gates pull requests on, alongside `npm run typecheck`.

```
npm run test:live
```

The live check against `https://docs.pmnd.rs/api/mcp`, on its own config so `npm test`
never picks it up. It runs weekly rather than on pull requests: it can only fail for
reasons outside your patch, and it files an issue when it does. What it catches is the
server's coverage drifting away from what `skills/docs/SKILL.md` claims — so it talks
to the real server, since a mock would keep passing through exactly that drift.

Only the positive claim is maintained, in [`coverage.mts`](coverage.mts).
The complement is derived from the `lib` enum the server publishes, so a library that
starts working — or a new one appearing in the enum — fails the check without anyone
keeping a second list in sync.

## License

MIT
