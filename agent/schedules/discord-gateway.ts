import { defineSchedule } from "eve/schedules";
import { bot } from "../channels/discord";

/**
 * Keeps the Discord Gateway WebSocket alive on serverless.
 *
 * Discord only delivers regular messages (what `@pmnd hey` is) over the
 * Gateway, so a listener has to be running. Gateway events are forwarded to
 * the channel's own webhook, which handles them statelessly.
 *
 * The cadence is bounded by the Vercel function timeout (300s by default), not
 * by Discord: a listener that outlives the function is killed mid-window and
 * every mention until the next cron is lost. So the socket is held just under
 * the timeout and re-opened every 4 minutes, leaving ~40s of overlap. Raising
 * the project's max duration is what would let both numbers grow.
 */

const LISTENER_MS = 280 * 1000;

export default defineSchedule({
  cron: "*/4 * * * *",
  run: async ({ waitUntil }) => {
    const discord = bot.getAdapter("discord");
    const baseUrl = process.env.EVE_PUBLIC_URL ?? `https://${process.env.VERCEL_URL}`;
    const webhookUrl = new URL(`${baseUrl}/eve/v1/discord`);

    // Deployment Protection answers this self-call with a 401 otherwise, and the
    // Gateway events are dropped where they are hardest to notice — the listener
    // itself stays happily connected.
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) webhookUrl.searchParams.set("x-vercel-protection-bypass", bypass);

    await bot.initialize();
    waitUntil(
      discord.startGatewayListener({ waitUntil }, LISTENER_MS, undefined, webhookUrl.toString()),
    );
  },
});
