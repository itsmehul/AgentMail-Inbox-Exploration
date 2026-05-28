import { NextResponse } from "next/server";
import { createAgentMailClient } from "@/lib/agentmail/client";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";

function parseRecipients(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const list = (Array.isArray(value) ? value : [value])
    .map((addr) => addr.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as {
      inboxId?: string;
      to?: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
      subject?: string;
      text?: string;
      html?: string;
    };

    const inboxId = body.inboxId?.trim();
    const to = parseRecipients(body.to);
    const subject = body.subject?.trim();
    const text = body.text?.trim();

    if (!inboxId) {
      return NextResponse.json({ error: "inboxId is required" }, { status: 400 });
    }
    if (!to?.length) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "subject is required" }, { status: 400 });
    }
    if (!text && !body.html?.trim()) {
      return NextResponse.json({ error: "text or html body is required" }, { status: 400 });
    }

    const client = createAgentMailClient();
    const message = await client.inboxes.messages.send(inboxId, {
      to: to.length === 1 ? to[0] : to,
      cc: parseRecipients(body.cc),
      bcc: parseRecipients(body.bcc),
      subject,
      text: text || undefined,
      html: body.html?.trim() || undefined,
    });

    return NextResponse.json({
      messageId: message.messageId,
      threadId: message.threadId,
    });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
