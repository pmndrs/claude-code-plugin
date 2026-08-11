// What skills/docs/SKILL.md claims about the docs MCP server, as data.
//
// Kept here so the two suites can disagree with each other: test/plugin.test.mjs
// checks the skill's prose against these lists offline, check-docs-mcp.mjs checks the
// lists against the real server on a schedule.

export const ENDPOINT = 'https://docs.pmnd.rs/api/mcp'

// Libraries whose docs site publishes the /llms-full.txt dump the server parses.
export const SERVED = ['react-three-fiber', 'drei', 'zustand', 'docs']

// Advertised in the tool's `lib` enum, but their sites 404 on /llms-full.txt, so
// every call fails and every index comes back empty. Fix in flight: pmndrs/docs#555.
export const UNSERVED = ['a11y', 'react-postprocessing', 'uikit', 'xr', 'prai', 'viverse', 'leva']
