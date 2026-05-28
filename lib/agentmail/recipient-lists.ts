import type { AgentMailClient } from "agentmail";
import { AgentMailError } from "agentmail";

function isNotFound(error: unknown): boolean {
  return error instanceof AgentMailError && error.statusCode === 404;
}

/** Remove a bounced/auto-blocked address so outbound sends can reach it again. */
export async function unblockSendRecipient(
  client: AgentMailClient,
  inboxId: string,
  email: string
): Promise<void> {
  const entry = email.trim().toLowerCase();
  if (!entry) return;

  try {
    await client.inboxes.lists.delete(inboxId, "send", "block", entry);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }
}

/** Prefer HM on the send allowlist so future intros are not blocked. */
export async function allowSendRecipient(
  client: AgentMailClient,
  inboxId: string,
  email: string
): Promise<void> {
  const entry = email.trim().toLowerCase();
  if (!entry) return;

  try {
    await client.inboxes.lists.create(inboxId, "send", "allow", { entry });
  } catch {
    // Already allowlisted or list API unavailable — outbound can still proceed.
  }
}

export async function ensureSendAllowed(
  client: AgentMailClient,
  inboxId: string,
  email: string
): Promise<void> {
  await unblockSendRecipient(client, inboxId, email);
  await allowSendRecipient(client, inboxId, email);
}

const BLOCKED_RE = /blocked:\s*([^\s(]+)/i;

export function blockedRecipientFromError(error: unknown): string | null {
  const message =
    error instanceof AgentMailError
      ? (typeof error.body === "object" &&
          error.body &&
          "message" in error.body &&
          typeof (error.body as { message?: string }).message === "string"
          ? (error.body as { message: string }).message
          : error.message)
      : error instanceof Error
        ? error.message
        : String(error);

  const match = message.match(BLOCKED_RE);
  return match?.[1]?.toLowerCase() ?? null;
}

export function isBlockedRecipientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /recipient\(s\) blocked/i.test(message);
}
