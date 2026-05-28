import type { AgentMail } from "agentmail";

type RawMessage = {
  inbox_id?: string;
  thread_id?: string;
  message_id?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  preview?: string;
  text?: string;
  html?: string;
  extracted_text?: string;
  timestamp?: string;
  created_at?: string;
};

type RawThread = {
  inbox_id?: string;
  thread_id?: string;
  message_count?: number;
  subject?: string;
  preview?: string;
  senders?: string[];
};

export type RawMessageReceivedEvent = {
  type?: string;
  event_type?: string;
  event_id?: string;
  message?: RawMessage;
  thread?: RawThread;
};

function normalizeMessage(raw: RawMessage): AgentMail.Message {
  return {
    inboxId: raw.inbox_id ?? "",
    threadId: raw.thread_id ?? "",
    messageId: raw.message_id ?? "",
    labels: [],
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    from: raw.from,
    to: raw.to ?? [],
    cc: raw.cc,
    bcc: raw.bcc,
    subject: raw.subject,
    preview: raw.preview,
    text: raw.text ?? raw.extracted_text,
    html: raw.html,
    extractedText: raw.extracted_text,
    size: 0,
    updatedAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
  } as AgentMail.Message;
}

export function normalizeWebhookEvent(payload: RawMessageReceivedEvent) {
  if (!payload.message?.message_id && !(payload.message as { messageId?: string })?.messageId) {
    throw new Error("Invalid AgentMail webhook payload");
  }

  const message = normalizeMessage(payload.message!);
  const thread = payload.thread
    ? {
        inboxId: payload.thread.inbox_id ?? "",
        threadId: payload.thread.thread_id ?? "",
        messageCount: payload.thread.message_count ?? 1,
        labels: [],
        timestamp: new Date(),
        senders: payload.thread.senders ?? [],
        recipients: [],
        lastMessageId: message.messageId,
        size: 0,
        updatedAt: new Date(),
        createdAt: new Date(),
      }
    : undefined;

  return {
    type: "event" as const,
    event_type: payload.event_type ?? "message.received",
    event_id: payload.event_id ?? `evt_${Date.now()}`,
    message,
    thread,
  };
}
