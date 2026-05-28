import { NextResponse } from "next/server";
import { agentMailErrorResponse } from "@/lib/agentmail/api-route";
import { ingestWebhookPayload } from "@/lib/inbox/inbox-service";
import type { RoleInbox } from "@/lib/agentmail/config";

function parseInboxRole(value: string | null): RoleInbox | undefined {
  if (value === "jill" || value === "hm" || value === "eng") return value;
  return undefined;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = parseInboxRole(searchParams.get("role"));
    const payload = await request.json();
    await ingestWebhookPayload(payload, role);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return agentMailErrorResponse(error, 400);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/agentmail/webhooks",
    webhooks: [
      "/api/agentmail/webhooks?role=jill",
      "/api/agentmail/webhooks?role=hm",
      "/api/agentmail/webhooks?role=eng",
    ],
    hint: "Configure three webhooks in AgentMail — one per inbox with the matching role query param.",
  });
}
