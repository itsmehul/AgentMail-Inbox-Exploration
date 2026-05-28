import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { discardApprovalDraft } from "@/lib/inbox/approval-drafts";

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as { logicalThreadId?: string };
    const logicalThreadId = body.logicalThreadId?.trim();

    if (!logicalThreadId) {
      return NextResponse.json({ error: "logicalThreadId is required" }, { status: 400 });
    }

    const result = discardApprovalDraft(logicalThreadId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not discard draft" }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
