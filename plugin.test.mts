// Offline checks, deliberately two.
//
// This plugin is configuration and prose -- there is no code here to unit-test, and
// asserting that a file contains what it contains proves nothing. A check earns its
// place only by pinning a relationship *between* two files that nothing else
// enforces, and only two such relationships exist.
//
//   npm test

import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'

const read = (p: string) => readFile(new URL(p, import.meta.url), 'utf8')
const readJson = async (p: string) => JSON.parse(await read(p))

test('the tool the skill calls is the one the server key namespaces', async () => {
  const { mcpServers } = await readJson('.mcp.json')
  const [key] = Object.keys(mcpServers)

  // Rename the server key and every mcp__pmndrs__* in the skill goes stale with no
  // error anywhere -- Claude just quietly stops finding the tool
  expect(await read('skills/docs/SKILL.md')).toContain(`mcp__${key}__get_page_content`)
})

test('the marketplace publishes the plugin this repo defines', async () => {
  const plugin = await readJson('.claude-plugin/plugin.json')
  const marketplace = await readJson('.claude-plugin/marketplace.json')

  expect(marketplace.plugins.map((p: { name: string }) => p.name)).toContain(plugin.name)
})
