import { defineMcpClientConnection } from "eve/connections";

/**
 * The pmndrs documentation MCP server — public, no auth.
 *
 * It serves one tool, `get_page_content(lib, path)`, which returns the raw
 * markdown of a single docs page. Paths are not guessable: call the
 * `docs_index` tool first to list the real paths for a library — it also
 * documents which libraries the server actually has content for.
 */
export default defineMcpClientConnection({
  url: "https://docs.pmnd.rs/api/mcp",
  description: [
    "Official pmndrs documentation for react-three-fiber, drei, zustand and the",
    "pmndrs/docs site itself. Returns the markdown of one docs page at a time,",
    "given a library name and a page path. Get the paths from the docs_index",
    "tool first — a guessed path is an error, not a redirect.",
    "The server also lists a11y, react-postprocessing, uikit, xr, prai, viverse",
    "and leva, but serves no content for them; say so rather than retrying.",
  ].join(" "),
  tools: { allow: ["get_page_content"] },
});
