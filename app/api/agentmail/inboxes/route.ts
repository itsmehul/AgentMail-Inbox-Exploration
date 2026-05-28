import { NextResponse } from "next/server";
import { createAgentMailClient } from "@/lib/agentmail/client";
import { agentMailErrorResponse, agentMailRouteGuard } from "@/lib/agentmail/api-route";
import { inboxToOption } from "@/lib/agentmail/inboxes";

export async function GET() {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const client = createAgentMailClient();
    const result = await client.inboxes.list({ limit: 50 });
    const inboxes = result.inboxes.map((inbox, i) => inboxToOption(inbox, i));

    return NextResponse.json({ inboxes, count: result.count });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const guard = agentMailRouteGuard();
  if (guard) return guard;

  try {
    const body = (await request.json()) as {
      username?: string;
      domain?: string;
      displayName?: string;
      clientId?: string;
    };

    const username = body.username?.trim();
    if (!username || !/^[a-z0-9][a-z0-9-]*$/i.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and hyphens." },
        { status: 400 }
      );
    }

    const domain = body.domain?.trim() || "agentmail.to";
    const clientId =
      body.clientId?.trim() ||
      `jill-diy-${username}-${domain}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const client = createAgentMailClient();
    const inbox = await client.inboxes.create({
      username,
      domain,
      displayName: body.displayName?.trim() || undefined,
      clientId,
    });

    return NextResponse.json({ inbox: inboxToOption(inbox, 0) }, { status: 201 });
  } catch (error) {
    return agentMailErrorResponse(error);
  }
}
