import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { normalizeAddrList } from "@/lib/inbox/approval-changes";
import { sendApprovedDraft } from "@/lib/inbox/approval-drafts";

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as {
      logicalThreadId?: string;
      to?: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
      text?: string;
    };

    const logicalThreadId = body.logicalThreadId?.trim();
    const text = body.text?.trim();

    if (!logicalThreadId) {
      return NextResponse.json({ error: "logicalThreadId is required" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await sendApprovedDraft(logicalThreadId, {
      to: normalizeAddrList(body.to),
      cc: normalizeAddrList(body.cc),
      bcc: normalizeAddrList(body.bcc),
      body: text,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not send approval" }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
