import type { AgentMail } from "agentmail";

type RawMessage = {
  inbox_id?: string;
  thread_id?: string;
  message_id?: string;
  messageId?: string;
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

type RawDelivery = {
  inbox_id?: string;
  thread_id?: string;
  message_id?: string;
  recipients?: string[];
  timestamp?: string;
};

export type RawWebhookPayload = {
  type?: string;
  event_type?: string;
  event_id?: string;
  message?: RawMessage;
  thread?: RawThread;
  delivery?: RawDelivery;
};

export type NormalizedWebhookEvent = {
  type: "event";
  event_type: string;
  event_id: string;
  message: AgentMail.Message;
  thread?: {
    inboxId: string;
    threadId: string;
    messageCount: number;
    labels: string[];
    timestamp: Date;
    senders: string[];
    recipients: string[];
    lastMessageId: string;
    size: number;
    updatedAt: Date;
    createdAt: Date;
  };
  needsFetch: boolean;
  deliveryRecipients?: string[];
};

function rawMessageId(raw: RawMessage | RawDelivery | undefined): string | undefined {
  if (!raw) return undefined;
  const msg = raw as RawMessage;
  return msg.message_id ?? msg.messageId;
}

function normalizeMessage(raw: RawMessage): AgentMail.Message {
  return {
    inboxId: raw.inbox_id ?? "",
    threadId: raw.thread_id ?? "",
    messageId: raw.message_id ?? raw.messageId ?? "",
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

function deliveryToMessage(delivery: RawDelivery): RawMessage {
  return {
    inbox_id: delivery.inbox_id,
    thread_id: delivery.thread_id,
    message_id: delivery.message_id,
    timestamp: delivery.timestamp,
    to: delivery.recipients,
  };
}

export function normalizeWebhookEvent(payload: RawWebhookPayload): NormalizedWebhookEvent {
  const eventType = payload.event_type ?? "message.received";
  const eventId = payload.event_id ?? `evt_${Date.now()}`;

  const rawMessage = payload.message ?? (payload.delivery ? deliveryToMessage(payload.delivery) : undefined);
  const messageId = rawMessageId(rawMessage);

  if (!messageId) {
    throw new Error("Invalid AgentMail webhook payload: missing message_id");
  }

  const message = normalizeMessage({ ...rawMessage, message_id: messageId });
  const isDeliveryEvent = eventType === "message.delivered" || Boolean(payload.delivery);
  const hasBody = Boolean(message.text?.trim() || message.preview?.trim() || message.html?.trim());
  const needsFetch = isDeliveryEvent || !hasBody;

  const thread = payload.thread
    ? {
        inboxId: payload.thread.inbox_id ?? message.inboxId,
        threadId: payload.thread.thread_id ?? message.threadId,
        messageCount: payload.thread.message_count ?? 1,
        labels: [] as string[],
        timestamp: new Date(),
        senders: payload.thread.senders ?? [],
        recipients: [] as string[],
        lastMessageId: message.messageId,
        size: 0,
        updatedAt: new Date(),
        createdAt: new Date(),
      }
    : message.threadId
      ? {
          inboxId: message.inboxId,
          threadId: message.threadId,
          messageCount: 1,
          labels: [] as string[],
          timestamp: new Date(),
          senders: [] as string[],
          recipients: payload.delivery?.recipients ?? [],
          lastMessageId: message.messageId,
          size: 0,
          updatedAt: new Date(),
          createdAt: new Date(),
        }
      : undefined;

  return {
    type: "event",
    event_type: eventType,
    event_id: eventId,
    message,
    thread,
    needsFetch,
    deliveryRecipients: payload.delivery?.recipients,
  };
}
