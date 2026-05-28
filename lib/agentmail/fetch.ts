import type { InboxOption } from "@/lib/types";

export type AgentMailStatus = {
  configured: boolean;
  connected: boolean;
  error?: string;
  inboxCount?: number;
  primaryInbox?: { inboxId: string; email: string; displayName?: string };
};

export async function fetchAgentMailStatus(): Promise<AgentMailStatus> {
  const res = await fetch("/api/agentmail/status");
  if (!res.ok) throw new Error("Failed to load AgentMail status");
  return res.json() as Promise<AgentMailStatus>;
}

export async function fetchAgentMailInboxes(): Promise<InboxOption[]> {
  const res = await fetch("/api/agentmail/inboxes");
  const data = (await res.json()) as { inboxes?: InboxOption[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to list inboxes");
  return data.inboxes ?? [];
}

export async function createAgentMailInbox(payload: {
  username: string;
  domain: string;
  displayName?: string;
}): Promise<InboxOption> {
  const res = await fetch("/api/agentmail/inboxes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { inbox?: InboxOption; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to create inbox");
  if (!data.inbox) throw new Error("No inbox returned");
  return data.inbox;
}

export async function sendAgentMailMessage(payload: {
  inboxId: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text: string;
}): Promise<{ messageId?: string; threadId?: string }> {
  const res = await fetch("/api/agentmail/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { messageId?: string; threadId?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to send message");
  return data;
}
