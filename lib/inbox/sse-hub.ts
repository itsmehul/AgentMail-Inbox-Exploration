type SseClient = {
  id: number;
  enqueue: (chunk: string) => void;
  close: () => void;
};

let nextClientId = 1;
const clients = new Map<number, SseClient>();

export function subscribeSse(enqueue: (chunk: string) => void, close: () => void): () => void {
  const id = nextClientId++;
  clients.set(id, { id, enqueue, close });

  return () => {
    clients.delete(id);
  };
}

export function broadcastInboxChanged(reason = "inbox_changed") {
  const payload = `event: inbox\ndata: ${JSON.stringify({ type: reason, at: new Date().toISOString() })}\n\n`;
  for (const client of clients.values()) {
    try {
      client.enqueue(payload);
    } catch {
      client.close();
      clients.delete(client.id);
    }
  }
}

export function sseKeepAlive(): string {
  return `: keepalive ${Date.now()}\n\n`;
}
