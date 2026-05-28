import { NextResponse } from "next/server";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { parseRecipientInput } from "@/lib/inbox/compose-recipients";
import { sendRoleReply } from "@/lib/inbox/jill-actions";

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as {
      logicalThreadId?: string;
      role?: "hm" | "eng";
      mode?: "reply" | "jill";
      text?: string;
      to?: string[];
      cc?: string[];
    };

    const logicalThreadId = body.logicalThreadId?.trim();
    const role = body.role;
    const mode = body.mode;
    const text = body.text?.trim();

    if (!logicalThreadId) {
      return NextResponse.json({ error: "logicalThreadId is required" }, { status: 400 });
    }
    if (role !== "hm" && role !== "eng") {
      return NextResponse.json({ error: "role must be hm or eng" }, { status: 400 });
    }
    if (mode !== "reply" && mode !== "jill") {
      return NextResponse.json({ error: "mode must be reply or jill" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await sendRoleReply({
      role,
      logicalThreadId,
      text,
      mode,
      to: parseRecipientInput(body.to),
      cc: parseRecipientInput(body.cc),
    });
    return NextResponse.json(result);
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
