# AGENTS.md

`pmndrs/claude-code-plugin` — a [Claude Code plugin](https://code.claude.com/docs/en/plugins)
published as the `pmndrs` plugin from the `pmndrs` marketplace.

Generalist: nothing here is scoped to a single pmndrs library. A component
that only helps one repo belongs in that repo, not here.

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
