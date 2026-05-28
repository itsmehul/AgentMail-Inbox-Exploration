import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { clearAgentMailAndLocalDb } from "@/lib/inbox/clear-inbox";
import { broadcastInboxChanged } from "@/lib/inbox/sse-hub";
import { listThreadsFromDb } from "@/lib/inbox/thread-mapper";

export async function POST() {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const result = await clearAgentMailAndLocalDb();
    broadcastInboxChanged("inbox_reset");
    const threads = listThreadsFromDb();
    return NextResponse.json({ ...result, threads, count: threads.length });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
