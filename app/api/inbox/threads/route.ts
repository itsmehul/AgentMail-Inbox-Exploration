import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { listThreadsFromDb } from "@/lib/inbox/thread-mapper";

export async function GET() {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const threads = listThreadsFromDb();
    return NextResponse.json({ threads, count: threads.length });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
