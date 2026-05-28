import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { listUnifiedInboxFromAgentMail } from "@/lib/inbox/agentmail-inbox";

export async function GET() {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const threads = await listUnifiedInboxFromAgentMail();
    return NextResponse.json({ threads, count: threads.length });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
