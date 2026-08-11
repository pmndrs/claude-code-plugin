# AGENTS.md

`pmndrs/claude-code-plugin` — a [Claude Code plugin](https://code.claude.com/docs/en/plugins)
published as the `pmndrs` plugin from the `pmndrs` marketplace.

Generalist: nothing here is scoped to a single pmndrs library. A component
that only helps one repo belongs in that repo, not here.

## Couplings nothing enforces

There is no build and no test suite here — this is configuration and prose. Two
edits break things silently, so check them by hand:

- **Renaming an `.mcp.json` server key** invalidates every `mcp__<key>__*` in the
  skills. Nothing errors; Claude just stops finding the tool. Grep for the old key.
- **`plugins[].name` in `marketplace.json`** is what `/plugin install <name>@pmndrs`
  resolves. `claude plugin validate` passes when it disagrees with
  `plugin.json` — verified — so a mismatch only shows up as a failing install.

Coverage claims in a skill (which libraries a server actually serves) are a
statement about someone else's deployment. Keep them in prose, and fix the server
rather than working around it here.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `pmndrs/claude-code-plugin`, via the `gh` CLI. External
PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — each role's label string equals its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and one `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
