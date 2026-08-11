// Offline checks over the plugin's own files. No network: a PR here must never go red
// because a third party is having a bad day. The live server is checked separately,
// on a schedule, by docs-mcp.live.mts.
//
//   npm test

import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'vitest'
import { ENDPOINT, SERVED } from './coverage.mts'

const read = (p: string) => readFile(new URL(`../${p}`, import.meta.url), 'utf8')
const readJson = async (p: string) => JSON.parse(await read(p))

const skill = () => read('skills/docs/SKILL.md')

describe('.mcp.json', () => {
  test('declares the pmndrs docs server over HTTP', async () => {
    const { mcpServers } = await readJson('.mcp.json')

    expect(Object.keys(mcpServers)).toEqual(['pmndrs'])
    expect(mcpServers.pmndrs.type).toBe('http')
    // The server key is what namespaces the tools, so SKILL.md can only call them
    // mcp__pmndrs__* while this stays 'pmndrs'
    expect(mcpServers.pmndrs.url).toBe(ENDPOINT)
  })
})

describe('skills/docs', () => {
  test('has the frontmatter Claude needs to trigger it', async () => {
    const [, frontmatter] = (await skill()).split('---\n', 2)

    expect(frontmatter).toMatch(/^name: docs$/m)
    expect(frontmatter).toMatch(/^description: \S/m)
  })

  test('calls the MCP tool by its namespaced name', async () => {
    expect(
      await skill(),
      'the tool name must match the .mcp.json server key',
    ).toContain('mcp__pmndrs__get_page_content')
  })

  // The Coverage section states which libraries are worth routing through the MCP.
  // Prose drifts; this keeps it pinned to coverage.mts, which the live check pins to
  // the real server.
  describe('Coverage section', () => {
    const coverage = async () => {
      const section = (await skill()).split('## Coverage')[1]?.split('\n## ')[0]
      expect(section, 'SKILL.md lost its "## Coverage" section').toBeDefined()

      const paragraphs = section!.split(/\n\s*\n/).filter((p) => p.trim())
      const served = paragraphs.find((p) => p.trim().startsWith('Served'))
      expect(served, 'Coverage needs a paragraph starting with "Served"').toBeDefined()

      return { section: section!, served: served! }
    }

    test('lists exactly the served libraries, no more and no fewer', async () => {
      const { served } = await coverage()
      const named = [...served.matchAll(/`([^`]+)`/g)].map((m) => m[1]!)

      // Set equality, not "includes": a library quietly added to the prose without
      // being added to SERVED is the same bug as one silently dropped
      expect(named.toSorted()).toEqual(SERVED.toSorted())
    })

    // Deliberately not asserted: that the rest of the section names no library. Prose
    // can enumerate them a dozen ways and a regex would only pretend to catch it. The
    // load-bearing guarantee is the set equality above -- as long as the served list
    // is exact, a stale name elsewhere misleads about nothing Claude acts on.
    test('points everything else at WebFetch', async () => {
      const { section, served } = await coverage()
      const rest = section.replace(served, '')

      expect(rest).toMatch(/unserved/i)
      expect(rest).toContain('WebFetch')
    })
  })
})

describe('manifests', () => {
  test('plugin.json names the plugin the marketplace publishes', async () => {
    const plugin = await readJson('.claude-plugin/plugin.json')
    const marketplace = await readJson('.claude-plugin/marketplace.json')

    expect(plugin.name).toBe('pmndrs')
    expect(
      marketplace.plugins.map((p: { name: string }) => p.name),
      `marketplace.json publishes no plugin named ${plugin.name}`,
    ).toContain(plugin.name)
  })
})
