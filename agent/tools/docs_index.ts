import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * The pmndrs docs server publishes its page lists as MCP *resources*
 * (`docs://<lib>/index`), and eve's MCP connections surface tools only. Without
 * those lists the model has to invent paths for `docs__get_page_content`,
 * which the server answers with "page not found". So this tool reads the
 * resource over the same endpoint by hand.
 */
const MCP_URL = "https://docs.pmnd.rs/api/mcp";

/**
 * The server advertises eleven libraries, but only these four actually publish
 * the `llms-full.txt` it parses. The other seven — a11y, react-postprocessing,
 * uikit, xr, prai, viverse, leva — return an empty index and answer every page
 * fetch with "Failed to fetch llms-full.txt: Not Found" (checked 2026-08-09).
 * Re-check with `resources/read` on `docs://<lib>/index` before widening this.
 */
const LIBS = ["react-three-fiber", "drei", "zustand", "docs"] as const;

/** The server answers JSON-RPC over SSE even for a single response. */
function parseSseJson(body: string): unknown {
  const payload = body
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("");
  if (!payload) throw new Error(`no data frame in MCP response: ${body}`);
  return JSON.parse(payload);
}

export default defineTool({
  description: [
    "List the documentation pages available for a pmndrs library, as",
    "`<path> - <title>` lines. Call this before docs__get_page_content and pass",
    "one of these paths verbatim.",
  ].join(" "),
  inputSchema: z.object({
    lib: z.enum(LIBS).describe("The pmndrs library to list pages for."),
  }),
  async execute({ lib }, ctx) {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "resources/read",
        params: { uri: `docs://${lib}/index` },
      }),
      signal: ctx.abortSignal,
    });

    if (!res.ok) {
      throw new Error(`pmndrs docs MCP returned ${res.status}`);
    }

    const message = parseSseJson(await res.text()) as {
      error?: { message?: string };
      result?: { contents?: { text?: string }[] };
    };

    if (message.error) {
      throw new Error(message.error.message ?? "pmndrs docs MCP error");
    }

    const pages = message.result?.contents?.[0]?.text;
    if (!pages) throw new Error(`no index published for ${lib}`);

    return { lib, pages };
  },
});
