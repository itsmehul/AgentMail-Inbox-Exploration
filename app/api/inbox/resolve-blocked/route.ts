import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { resolveBlockedPipeline } from "@/lib/inbox/jill-actions";

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as {
      logicalThreadId?: string;
      instructions?: string;
    };

    const logicalThreadId = body.logicalThreadId?.trim();
    const instructions = body.instructions?.trim();

    if (!logicalThreadId) {
      return NextResponse.json({ error: "logicalThreadId is required" }, { status: 400 });
    }
    if (!instructions) {
      return NextResponse.json({ error: "instructions are required" }, { status: 400 });
    }

    const result = await resolveBlockedPipeline(logicalThreadId, instructions);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not resolve" }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
