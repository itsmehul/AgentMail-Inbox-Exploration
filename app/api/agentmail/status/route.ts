import { NextResponse } from "next/server";
import { createAgentMailClient, isAgentMailConfigured } from "@/lib/agentmail/client";
import { agentMailErrorMessage } from "@/lib/agentmail/errors";

export async function GET() {
  if (!isAgentMailConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
    });
  }

  try {
    const client = createAgentMailClient();
    const result = await client.inboxes.list({ limit: 1 });
    const first = result.inboxes[0];

    return NextResponse.json({
      configured: true,
      connected: true,
      inboxCount: result.count,
      primaryInbox: first
        ? { inboxId: first.inboxId, email: first.email, displayName: first.displayName }
        : null,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: agentMailErrorMessage(error),
    });
  }
}
