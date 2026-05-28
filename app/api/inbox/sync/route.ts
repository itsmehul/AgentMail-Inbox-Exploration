import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { isAgentMailConfigured } from "@/lib/agentmail/client";
import { getJillInboxEmail, getHmEmail } from "@/lib/agentmail/config";
import { listUnifiedInboxFromAgentMail } from "@/lib/inbox/agentmail-inbox";
import { syncInboxFromAgentMail } from "@/lib/inbox/inbox-service";

function configError(): NextResponse | null {
  if (!isAgentMailConfigured()) {
    return NextResponse.json(
      { error: "AgentMail is not configured. Set AGENTMAIL_API_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    getJillInboxEmail();
    getHmEmail();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Missing inbox configuration" },
      { status: 503 }
    );
  }
  return null;
}

export async function POST() {
  const guard = agentMailRouteGuard();
  if (guard) return guard;
  const cfg = configError();
  if (cfg) return cfg;

  try {
    const result = await syncInboxFromAgentMail();
    const threads = await listUnifiedInboxFromAgentMail();
    return NextResponse.json({ ...result, threads, count: threads.length });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
