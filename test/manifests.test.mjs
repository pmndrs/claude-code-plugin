import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readJson, root, agents, skills, asList } from './helpers.mjs'

const plugin = readJson('.claude-plugin', 'plugin.json')
const marketplace = readJson('.claude-plugin', 'marketplace.json')
const mcp = readJson('.mcp.json')

test('plugin manifest declares a name and a semver version', () => {
  assert.match(plugin.name, /^[a-z0-9][a-z0-9-]*$/)
  assert.match(plugin.version, /^\d+\.\d+\.\d+/)
  assert.ok(plugin.description?.length > 20, 'description carries the plugin listing')
})

test('marketplace entry agrees with the plugin manifest', () => {
  const entry = marketplace.plugins.find((p) => p.source === './')
  assert.ok(entry, 'marketplace must publish this checkout')
  // The plugin name is baked into every scoped MCP tool name
  // (mcp__plugin_<plugin>_<server>__<tool>), so a rename here silently breaks
  // every agent tools list. Keep the two manifests in step.
  assert.equal(entry.name, plugin.name)
})

test('bundled MCP servers are fully specified', () => {
  const servers = Object.entries(mcp.mcpServers ?? {})
  assert.ok(servers.length > 0, '.mcp.json must declare at least one server')
  for (const [name, config] of servers) {
    assert.match(name, /^[a-z0-9][a-z0-9-]*$/, `server key ${name} should be a plain slug`)
    assert.ok(config.type, `server ${name} declares a transport`)
    if (['http', 'sse', 'ws'].includes(config.type)) {
      assert.match(config.url, /^https:\/\//, `server ${name} must be reached over https`)
    } else {
      assert.ok(config.command, `stdio server ${name} declares a command`)
    }
  }
})

test('README lists every component file the plugin ships', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8')
  const shipped = [
    '.mcp.json',
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    ...skills().map((s) => s.path),
    ...agents().map((a) => a.path),
  ]
  for (const path of shipped) {
    assert.ok(readme.includes(path), `README should document ${path}`)
  }
})

const scope = (s) => s.replace(/[^A-Za-z0-9_-]/g, '_')
const components = () => [...skills(), ...agents()]

test('every bundled MCP server is reached by some component', () => {
  // Which component is deliberately not pinned: a server added for a future
  // skill has no business being documented by an existing one. What matters is
  // that nothing in .mcp.json is dead config.
  for (const key of Object.keys(mcp.mcpServers ?? {})) {
    const scoped = `plugin:${plugin.name}:${key}`
    const prefix = `mcp__plugin_${scope(plugin.name)}_${scope(key)}__`
    const users = components().filter(
      (c) => c.body.includes(scoped) || asList(c.fields.tools).some((t) => t.startsWith(prefix)),
    )
    assert.ok(users.length > 0, `server "${key}" is declared but no skill or agent uses it`)
  }
})

test('components that read MCP resources name the server they read from', () => {
  // ReadMcpResourceTool takes a configured server name. Bundled in a plugin,
  // that name is plugin:<plugin>:<server> — the bare key from .mcp.json is not
  // a name anything answers to.
  const scoped = Object.keys(mcp.mcpServers ?? {}).map((key) => `plugin:${plugin.name}:${key}`)
  for (const component of components()) {
    const uses = component.body.includes('ReadMcpResourceTool') || asList(component.fields.tools).includes('ReadMcpResourceTool')
    if (!uses) continue
    assert.ok(
      scoped.some((name) => component.body.includes(name)),
      `${component.path} reads MCP resources without naming a server; expected one of ${scoped.join(', ')}`,
    )
  }
})

test('every marketplace source resolves on disk', () => {
  for (const entry of marketplace.plugins) {
    if (typeof entry.source !== 'string' || !entry.source.startsWith('.')) continue
    assert.ok(existsSync(join(root, entry.source)), `missing source ${entry.source}`)
  }
})
