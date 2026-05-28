import type { AgentMail } from "agentmail";
import type { AgentMailClient } from "agentmail";
import { AgentMailError } from "agentmail";

export function isAgentMailNotFound(error: unknown): boolean {
  if (error instanceof AgentMailError && error.statusCode === 404) return true;
  return (error as { statusCode?: number } | undefined)?.statusCode === 404;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** AgentMail may return 404 briefly after send or for outbound-only message ids. */
export async function fetchInboxMessage(
  client: AgentMailClient,
  inboxId: string,
  messageId: string,
  options?: { fallback?: AgentMail.Message; retries?: number }
): Promise<AgentMail.Message | undefined> {
  const retries = options?.retries ?? 3;
  const fallback = options?.fallback;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await client.inboxes.messages.get(inboxId, messageId);
    } catch (error) {
      if (!isAgentMailNotFound(error)) throw error;
      if (attempt < retries - 1) {
        await sleep(250 * (attempt + 1));
        continue;
      }
      if (fallback?.text?.trim() || fallback?.preview?.trim() || fallback?.html?.trim()) {
        return fallback;
      }
      return undefined;
    }
  }

  return undefined;
}
