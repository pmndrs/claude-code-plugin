// Live contract test for the `pmndrs` MCP server declared in .mcp.json.
//
// It talks to the real docs.pmnd.rs, on purpose. What can break here is not our
// code -- it is the server's coverage drifting away from what skills/docs/SKILL.md
// promises. A mock would keep passing through exactly that drift.
//
//   node --test test/

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

// The libraries whose docs site publishes the /llms-full.txt dump the server parses.
// SKILL.md tells Claude these are the ones worth routing through MCP.
const SERVED = ['react-three-fiber', 'drei', 'zustand', 'docs']

// Advertised in the tool's `lib` enum, but their sites 404 on /llms-full.txt, so
// every call fails and every index comes back empty. See pmndrs/docs#555.
const UNSERVED = ['a11y', 'react-postprocessing', 'uikit', 'xr', 'prai', 'viverse', 'leva']

let endpoint
let skill

async function rpc(method, params = {}) {
  const res = await fetch(endpoint, {
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
  if (error) return ''
  return result.contents[0].text
}

before(async () => {
  const mcp = JSON.parse(await readFile(new URL('.mcp.json', `file://${root}`), 'utf8'))
  endpoint = mcp.mcpServers.pmndrs.url
  skill = await readFile(new URL('skills/docs/SKILL.md', `file://${root}`), 'utf8')
})

describe('.mcp.json', () => {
  test('declares the pmndrs docs server over HTTP', () => {
    assert.equal(endpoint, 'https://docs.pmnd.rs/api/mcp')
  })
})

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

    assert.ok(tool, `get_page_content is gone -- SKILL.md calls it by name`)
    assert.deepEqual(tool.inputSchema.required.sort(), ['lib', 'path'])
  })

  test('exposes an index resource per library', async () => {
    const { result } = await rpc('resources/list')
    const uris = result.resources.map((r) => r.uri)

    for (const lib of SERVED) {
      assert.ok(uris.includes(`docs://${lib}/index`), `missing docs://${lib}/index`)
    }
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

// Drift detectors. These fail when reality moves -- which is the point: SKILL.md
// states coverage as fact, and a stale claim sends Claude down a dead end.
describe('coverage claim', () => {
  test('no unserved library has quietly started working', async () => {
    const working = []
    for (const lib of UNSERVED) {
      if ((await indexOf(lib)).length > 0) working.push(lib)
    }

    assert.deepEqual(
      working,
      [],
      `${working.join(', ')} now serve docs -- widen SERVED here and the Coverage ` +
        `section of skills/docs/SKILL.md, which still tells Claude to use WebFetch for them`,
    )
  })

  test('SKILL.md names every served library', () => {
    for (const lib of SERVED) {
      assert.ok(skill.includes(lib), `SKILL.md never mentions ${lib}`)
    }
  })

  test('SKILL.md warns about every unserved library', () => {
    for (const lib of UNSERVED) {
      assert.ok(skill.includes(lib), `SKILL.md never warns that ${lib} is unserved`)
    }
  })
})
