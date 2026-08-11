// Offline checks, deliberately few.
//
// This plugin is configuration and prose -- there is no code here to unit-test, and
// asserting that a file contains what it contains proves nothing. So the rule is: a
// test earns its place only by pinning a relationship *between* two files that
// nothing else enforces. Everything else was dropped.
//
//   npm test

import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'vitest'
import { ENDPOINT, SERVED } from './coverage.mts'

const read = (p: string) => readFile(new URL(p, import.meta.url), 'utf8')
const readJson = async (p: string) => JSON.parse(await read(p))

const skill = () => read('skills/docs/SKILL.md')

describe('SKILL.md <-> .mcp.json', () => {
  test('the tool the skill calls is the one the server key namespaces', async () => {
    const { mcpServers } = await readJson('.mcp.json')
    const [key] = Object.keys(mcpServers)

    // Rename the server key and every mcp__pmndrs__* in the skill goes stale, with
    // no error anywhere -- Claude just silently stops finding the tool
    expect(await skill()).toContain(`mcp__${key}__get_page_content`)
  })

  test('the live check probes the server the plugin actually declares', async () => {
    const { mcpServers } = await readJson('.mcp.json')

    // Otherwise docs-mcp.live.mts happily verifies a server nobody connects to
    expect(Object.values(mcpServers).map((s) => (s as { url: string }).url)).toContain(ENDPOINT)
  })
})

describe('SKILL.md <-> coverage.mts', () => {
  test('the skill lists exactly the libraries we claim are served', async () => {
    const section = (await skill()).split('## Coverage')[1]?.split('\n## ')[0]
    expect(section, 'SKILL.md lost its "## Coverage" section').toBeDefined()

    const served = section!.split(/\n\s*\n/).find((p) => p.trim().startsWith('Served'))
    expect(served, 'Coverage needs a paragraph starting with "Served"').toBeDefined()

    // Set equality: when the live check fails and someone updates SERVED, this is what
    // makes them update the prose Claude actually reads. Adding a name to one side
    // only is the bug, in either direction.
    const named = [...served!.matchAll(/`([^`]+)`/g)].map((m) => m[1]!)
    expect(named.toSorted()).toEqual(SERVED.toSorted())
  })
})

describe('plugin.json <-> marketplace.json', () => {
  test('the marketplace publishes the plugin this repo defines', async () => {
    const plugin = await readJson('.claude-plugin/plugin.json')
    const marketplace = await readJson('.claude-plugin/marketplace.json')

    expect(marketplace.plugins.map((p: { name: string }) => p.name)).toContain(plugin.name)
  })
})
