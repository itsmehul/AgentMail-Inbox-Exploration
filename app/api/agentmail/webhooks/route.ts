import { NextResponse } from "next/server";
import { agentMailErrorResponse } from "@/lib/agentmail/api-route";
import { ingestWebhookPayload } from "@/lib/inbox/inbox-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await ingestWebhookPayload(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
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
