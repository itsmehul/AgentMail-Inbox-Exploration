import { NextResponse } from "next/server";
import { agentMailErrorResponse } from "@/lib/agentmail/api-route";
import { ingestWebhookPayload } from "@/lib/inbox/inbox-service";

export async function POST(request: Request) {
  const timestamp = new Date().toISOString();
  try {
    const payload = await request.json();
    const eventType = payload?.event_type ?? "unknown";
    const eventId = payload?.event_id ?? "unknown";
    const messageId = payload?.message?.message_id ?? payload?.message?.messageId ?? payload?.delivery?.message_id ?? "unknown";
    console.log(`[Webhook RECEIVED] [${timestamp}] event_type: "${eventType}", event_id: "${eventId}", message_id: "${messageId}"`);
    
    await ingestWebhookPayload(payload);
    
    console.log(`[Webhook SUCCESS] [${timestamp}] event_id: "${eventId}" successfully processed.`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[Webhook ERROR] [${timestamp}] Failed to process webhook:`, error);
    return agentMailErrorResponse(error, 400);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/agentmail/webhooks",
    supportedEvents: ["message.received", "message.delivered"],
    hint:
      "Point AgentMail at /api/agentmail/webhooks (one URL for all inboxes). Role is inferred from inbox_id and delivery recipients.",
  });
}
