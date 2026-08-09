import { createDiscordAdapter } from "@chat-adapter/discord";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";

/**
 * Poimandres Discord. Members talk to the agent with `@pmnd hey`.
 *
 * Regular messages only reach a bot through the Discord Gateway (with the
 * Message Content intent), never through HTTP Interactions — so the webhook
 * mounted here at POST /eve/v1/discord is fed by the Gateway listener kept
 * alive in agent/schedules/discord-gateway.ts.
 */

const GUILD_ID = "740090768164651008";

/** Channel ids the bot answers in. Everything else is ignored. */
const allowedChannelIds = new Set(
  (process.env.DISCORD_ALLOWED_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

function isAllowed(thread: Thread, message: Message): boolean {
  const { guild_id: guildId } = (message.raw ?? {}) as { guild_id?: string };
  if (guildId && guildId !== GUILD_ID) return false;
  // An empty allowlist keeps the bot silent rather than open to the whole server.
  return allowedChannelIds.has(thread.channelId);
}

export const { bot, channel, send } = chatSdkChannel({
  userName: "pmnd",
  adapters: {
    discord: createDiscordAdapter(),
  },
  state: process.env.REDIS_URL ? createRedisState() : createMemoryState(),
});

bot.onNewMention(async (thread: Thread, message: Message) => {
  if (!isAllowed(thread, message)) return;
  await thread.subscribe();
  await send(message.text, {
    thread,
    title: `Discord · ${message.author.userName}`,
  });
});

bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
  if (!isAllowed(thread, message)) return;
  await send(message.text, { thread });
});

export default channel;
