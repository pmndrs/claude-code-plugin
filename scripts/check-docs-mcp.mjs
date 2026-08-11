// Live contract check against the real docs.pmnd.rs MCP server.
//
// Deliberately outside test/, which `node --test` walks wholesale regardless of file
// naming: a third party being down must never redden a pull request here. CI runs
// this on a schedule instead, where a failure means the world moved rather than that
// someone's patch is wrong.
//
//   node --test scripts/check-docs-mcp.mjs

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ENDPOINT, SERVED, UNSERVED } from './docs-coverage.mjs'

async function rpc(method, params = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(30_000),
  })
  assert.ok(res.ok, `${method} -> HTTP ${res.status}`)

  // The server answers over SSE even for a single response
  const body = await res.text()
  const line = body.split('\n').find((l) => l.startsWith('data: '))
  assert.ok(line, `${method} -> no data frame in response: ${body.slice(0, 200)}`)
  return JSON.parse(line.slice(6))
}

/** Index text for a library, or '' when the server has no dump to parse. */
async function indexOf(lib) {
  const { result, error } = await rpc('resources/read', { uri: `docs://${lib}/index` })
  return error ? '' : result.contents[0].text
}

describe('server contract', () => {
  test('speaks MCP and identifies as pmndrs-docs', async () => {
    const { result } = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'pmndrs-plugin-test', version: '0' },
    })

    assert.equal(result.serverInfo.name, 'pmndrs-docs')
  })

  test('exposes get_page_content taking a lib and a path', async () => {
    const { result } = await rpc('tools/list')
    const tool = result.tools.find((t) => t.name === 'get_page_content')

    assert.ok(tool, 'get_page_content is gone -- SKILL.md calls it by name')
    assert.deepEqual(tool.inputSchema.required.sort(), ['lib', 'path'])
  })
})

// The workflow SKILL.md prescribes: read the index, take a path from it verbatim,
// fetch that page. If this passes, documentation lookup genuinely works end to end.
describe('index-then-fetch', () => {
  for (const lib of SERVED) {
    test(`${lib} serves an index and its pages`, async () => {
      const index = await indexOf(lib)
      assert.ok(index.length > 0, `${lib} index is empty -- its llms-full.txt is missing`)

      const entries = index.split('\n').filter(Boolean)
      for (const entry of entries) {
        assert.match(entry, /^\/\S* - .+$/, `${lib} index line is not "{path} - {title}"`)
      }

      const path = entries[0].split(' - ')[0]
      const { result, error } = await rpc('tools/call', {
        name: 'get_page_content',
        arguments: { lib, path },
      })
      assert.ok(!error, `${lib} ${path} -> ${error?.message}`)

      const content = result.content[0].text
      assert.ok(!content.startsWith('MCP server error'), `${lib} ${path} -> ${content}`)
      assert.ok(content.length > 100, `${lib} ${path} -> ${content.length} chars, looks empty`)
    })
  }
})

describe('coverage claim', () => {
  test('no unserved library has quietly started working', async () => {
    const working = []
    for (const lib of UNSERVED) {
      if ((await indexOf(lib)).length > 0) working.push(lib)
    }

    assert.deepEqual(
      working,
      [],
      `${working.join(', ')} now serve docs -- move them to SERVED in ` +
        `scripts/docs-coverage.mjs and update the Coverage section of ` +
        `skills/docs/SKILL.md, which still sends Claude to WebFetch for them`,
    )
  })
})
