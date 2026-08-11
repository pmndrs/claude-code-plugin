// Live contract check against the real docs.pmnd.rs MCP server.
//
//   npm run test:live
//
// Not matched by vitest.config.mts, so `npm test` never reaches the network. CI runs
// this weekly, where a failure means the world moved rather than that someone's patch
// is wrong.

import { describe, expect, test } from 'vitest'
import { ENDPOINT, SERVED } from './coverage.mts'

async function rpc(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(30_000),
  })
  expect(res.ok, `${method} -> HTTP ${res.status}`).toBe(true)

  // The server answers over SSE even for a single response
  const body = await res.text()
  const line = body.split('\n').find((l) => l.startsWith('data: '))
  expect(line, `${method} -> no data frame in: ${body.slice(0, 200)}`).toBeDefined()
  return JSON.parse(line!.slice(6))
}

/** Every library the server advertises -- its own enum is the authority, not us. */
async function advertised(): Promise<string[]> {
  const { result } = await rpc('tools/list')
  const tool = result.tools.find((t: { name: string }) => t.name === 'get_page_content')
  expect(tool, 'get_page_content is gone -- SKILL.md calls it by name').toBeDefined()
  return tool.inputSchema.properties.lib.enum
}

/** Index text for a library, or '' when the server has no dump to parse. */
async function indexOf(lib: string): Promise<string> {
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

    expect(result.serverInfo.name).toBe('pmndrs-docs')
  })

  test('exposes get_page_content taking a lib and a path', async () => {
    const { result } = await rpc('tools/list')
    const tool = result.tools.find((t: { name: string }) => t.name === 'get_page_content')

    expect(tool.inputSchema.required.toSorted()).toEqual(['lib', 'path'])
  })
})

// The workflow SKILL.md prescribes: read the index, take a path from it verbatim,
// fetch that page. If this passes, documentation lookup genuinely works end to end.
describe('index-then-fetch', () => {
  test.for(SERVED)('%s serves an index and its pages', async (lib) => {
    const index = await indexOf(lib)
    expect(index, `${lib} index is empty -- its llms-full.txt is missing`).not.toBe('')

    const entries = index.split('\n').filter(Boolean)
    for (const entry of entries) {
      expect(entry, `${lib} index line is not "{path} - {title}"`).toMatch(/^\/\S* - .+$/)
    }

    const path = entries[0]!.split(' - ')[0]!
    const { result, error } = await rpc('tools/call', {
      name: 'get_page_content',
      arguments: { lib, path },
    })
    expect(error, `${lib} ${path} -> ${error?.message}`).toBeUndefined()

    const content: string = result.content[0].text
    expect(content, `${lib} ${path} -> ${content}`).not.toMatch(/^MCP server error/)
    expect(content.length, `${lib} ${path} -> looks empty`).toBeGreaterThan(100)
  })
})

describe('coverage claim', () => {
  // The one assertion that keeps SERVED honest in both directions, over whatever set
  // of libraries the server happens to advertise today. A library that starts working
  // fails this just as loudly as one that stops.
  test('the libraries that actually work are exactly the ones we claim', async () => {
    const libs = await advertised()
    const working: string[] = []
    for (const lib of libs) {
      if ((await indexOf(lib)) !== '') working.push(lib)
    }

    expect(
      working.toSorted(),
      `update SERVED in coverage.mts and the Coverage section of skills/docs/SKILL.md`,
    ).toEqual(SERVED.toSorted())
  })
})
