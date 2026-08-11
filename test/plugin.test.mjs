// Offline checks over the plugin's own files. No network: a PR here must never go
// red because a third party is having a bad day. The live server is checked
// separately, on a schedule, by scripts/check-docs-mcp.mjs.
//
//   node --test

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ENDPOINT, SERVED, UNSERVED } from '../scripts/docs-coverage.mjs'

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8')
const readJson = async (p) => JSON.parse(await read(p))

describe('.mcp.json', () => {
  test('declares the pmndrs docs server over HTTP', async () => {
    const { mcpServers } = await readJson('.mcp.json')

    assert.deepEqual(Object.keys(mcpServers), ['pmndrs'])
    assert.equal(mcpServers.pmndrs.type, 'http')
    // The server key is what namespaces the tools, so SKILL.md can only call them
    // mcp__pmndrs__* while this stays 'pmndrs'
    assert.equal(mcpServers.pmndrs.url, ENDPOINT)
  })
})

describe('skills/docs', () => {
  test('has the frontmatter Claude needs to trigger it', async () => {
    const skill = await read('skills/docs/SKILL.md')
    const [, frontmatter] = skill.split('---\n', 2)

    assert.match(frontmatter, /^name: docs$/m)
    assert.match(frontmatter, /^description: \S/m)
  })

  test('calls the MCP tool by its namespaced name', async () => {
    const skill = await read('skills/docs/SKILL.md')

    assert.ok(
      skill.includes('mcp__pmndrs__get_page_content'),
      'the tool name must match the .mcp.json server key',
    )
  })

  // The Coverage section states which libraries are worth routing through the MCP.
  // Prose drifts; these keep it pinned to coverage.mjs, which the live suite checks
  // against the real server.
  describe('Coverage section', () => {
    const paragraphs = async () => {
      const skill = await read('skills/docs/SKILL.md')
      const section = skill.split('## Coverage')[1]?.split('\n## ')[0]
      assert.ok(section, 'SKILL.md lost its "## Coverage" section')

      const served = section.split(/\n\s*\n/).find((p) => p.trim().startsWith('Served'))
      const unserved = section.split(/\n\s*\n/).find((p) => p.trim().startsWith('Unserved'))
      assert.ok(served, 'Coverage needs a paragraph starting with "Served"')
      assert.ok(unserved, 'Coverage needs a paragraph starting with "Unserved"')

      return { served, unserved }
    }

    test('lists every served library as served', async () => {
      const { served } = await paragraphs()

      for (const lib of SERVED) {
        assert.ok(served.includes(`\`${lib}\``), `Coverage never lists ${lib} as served`)
      }
    })

    test('lists every unserved library as unserved', async () => {
      const { unserved } = await paragraphs()

      for (const lib of UNSERVED) {
        assert.ok(unserved.includes(`\`${lib}\``), `Coverage never warns that ${lib} is unserved`)
      }
    })

    test('does not send Claude to a library that answers nothing', async () => {
      const { served } = await paragraphs()

      for (const lib of UNSERVED) {
        assert.ok(!served.includes(`\`${lib}\``), `Coverage lists ${lib} as served, but it is not`)
      }
    })
  })
})

describe('manifests', () => {
  test('plugin.json names the plugin the marketplace publishes', async () => {
    const plugin = await readJson('.claude-plugin/plugin.json')
    const marketplace = await readJson('.claude-plugin/marketplace.json')

    assert.equal(plugin.name, 'pmndrs')
    assert.ok(
      marketplace.plugins.some((p) => p.name === plugin.name),
      `marketplace.json publishes no plugin named ${plugin.name}`,
    )
  })
})
