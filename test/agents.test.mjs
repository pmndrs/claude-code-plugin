import test from 'node:test'
import assert from 'node:assert/strict'
import { readJson, agents, skills, asList } from './helpers.mjs'

const plugin = readJson('.claude-plugin', 'plugin.json')
const mcp = readJson('.mcp.json')

// mcp__plugin_<plugin-name>_<server-name>__<tool-name>, with any character
// outside A-Za-z0-9_- replaced by _.
const scope = (s) => s.replace(/[^A-Za-z0-9_-]/g, '_')
const serverKeys = Object.keys(mcp.mcpServers ?? {})
const prefixes = serverKeys.map((key) => `mcp__plugin_${scope(plugin.name)}_${scope(key)}__`)

// Built-in tools this plugin's agents are allowed to name. An unlisted entry is
// far more likely a typo than a tool we meant to grant: a tools list that
// resolves to nothing makes the agent fail to launch.
const BUILTIN = new Set([
  'Agent', 'Bash', 'Edit', 'Glob', 'Grep', 'ListMcpResourcesTool', 'NotebookEdit',
  'Read', 'ReadMcpResourceTool', 'Skill', 'TodoWrite', 'WebFetch', 'WebSearch', 'Write',
])

const MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit'])
const COLORS = new Set(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'])

// Ignored for plugin-shipped agents — present here they read as configuration
// that does something, and it does not.
const IGNORED_IN_PLUGINS = ['hooks', 'mcpServers', 'permissionMode']

const all = agents()

test('the plugin ships at least one agent', () => {
  assert.ok(all.length > 0)
})

for (const agent of all) {
  const { fields, body, path } = agent

  test(`${path}: identity is well formed`, () => {
    assert.match(fields.name, /^[a-z0-9][a-z0-9-]*$/)
    assert.ok(
      path.endsWith(`/${fields.name}.md`),
      `file name should match the declared name (${fields.name})`,
    )
    // The description is the whole basis on which Claude decides to delegate.
    assert.ok(fields.description?.length > 60, 'description must say what it does and when to use it')
    assert.ok(body.trim().length > 200, 'an agent needs a real system prompt')
  })

  test(`${path}: only uses front matter that plugin agents honour`, () => {
    for (const field of IGNORED_IN_PLUGINS) {
      assert.ok(!(field in fields), `${field} is ignored for plugin-shipped agents`)
    }
    if (fields.model) assert.ok(MODELS.has(fields.model) || fields.model.startsWith('claude-'))
    if (fields.color) assert.ok(COLORS.has(fields.color))
    if (fields.isolation) assert.equal(fields.isolation, 'worktree')
    if (fields.maxTurns) assert.match(String(fields.maxTurns), /^\d+$/)
  })

  test(`${path}: every tool name resolves`, () => {
    const tools = asList(fields.tools)
    assert.ok(tools.length > 0, 'an unrestricted docs agent would inherit Write and Edit')

    for (const tool of tools) {
      if (!tool.startsWith('mcp__')) {
        assert.ok(BUILTIN.has(tool.replace(/\(.*\)$/, '')), `unknown built-in tool: ${tool}`)
        continue
      }
      // A bare server key never resolves for a plugin-bundled server, and the
      // failure is silent until the agent runs with no docs access at all.
      for (const key of serverKeys) {
        assert.ok(!tool.startsWith(`mcp__${key}__`), `${tool} uses the bare server key, not the plugin scope`)
      }
      const prefix = prefixes.find((p) => tool.startsWith(p))
      assert.ok(prefix, `${tool} matches no bundled server; expected one of ${prefixes.join(', ')}`)
      assert.ok(tool.length > prefix.length, `${tool} names no tool after the scope`)
    }
  })

  test(`${path}: MCP tools it grants are ones the skills document`, () => {
    const documented = skills().map((s) => s.body).join('\n')
    for (const tool of asList(fields.tools)) {
      const prefix = prefixes.find((p) => tool.startsWith(p))
      if (!prefix) continue
      const short = tool.slice(prefix.length)
      assert.ok(documented.includes(short), `${short} is granted but no SKILL.md explains it`)
    }
  })

  test(`${path}: preloaded skills exist`, () => {
    const available = new Map(skills().map((s) => [s.fields.name, s]))
    for (const name of asList(fields.skills)) {
      // A missing skill is skipped with a debug-log warning, so the agent would
      // ship silently stripped of the protocol it is built around.
      assert.ok(available.has(name.replace(/^.*:/, '')), `preloaded skill "${name}" does not exist`)
    }
  })

  test(`${path}: does not restate what the skill owns`, () => {
    // Which libraries the server actually serves lives in SKILL.md, with a
    // checked-on date. A second copy here is a copy that goes stale unnoticed.
    assert.doesNotMatch(body, /^\|.*\b(react-three-fiber|drei|zustand)\b/m, 'library table belongs in SKILL.md')
    assert.doesNotMatch(body, /llms-full\.txt/, 'coverage caveats belong in SKILL.md')
  })

  test(`${path}: names the MCP server by its scoped form`, () => {
    for (const key of serverKeys) {
      const scoped = `plugin:${plugin.name}:${key}`
      if (!body.includes(scoped)) continue
      // If it explains the scoped name at all, it must not also hand out the
      // bare key as if it were usable.
      assert.doesNotMatch(body, new RegExp(`\`${key}\`\\s+(server|as the \`server\`)`))
    }
  })
}

test('agent names do not collide with skill names', () => {
  // Both surface under the same `pmndrs:<name>` scoped identifier, one at `/`
  // and one at `@`. Sharing a name makes the two indistinguishable in prose.
  const skillNames = new Set(skills().map((s) => s.fields.name))
  for (const agent of all) {
    assert.ok(!skillNames.has(agent.fields.name), `${agent.fields.name} is both an agent and a skill`)
  }
})
