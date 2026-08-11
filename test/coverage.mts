// What skills/docs/SKILL.md claims about the docs MCP server, as data.
//
// Only the positive claim is written down. The complement is derived from the `lib`
// enum the server publishes, so a library that starts working -- or a new one
// appearing in the enum -- is caught without anyone maintaining a second list.

export const ENDPOINT = 'https://docs.pmnd.rs/api/mcp'

/** Libraries whose docs site publishes the /llms-full.txt dump the server parses. */
export const SERVED = ['react-three-fiber', 'drei', 'zustand', 'docs']
