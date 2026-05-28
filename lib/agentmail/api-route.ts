import { NextResponse } from "next/server";
import { agentMailErrorMessage } from "@/lib/agentmail/errors";
import { isAgentMailConfigured } from "@/lib/agentmail/client";

export function notConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "AgentMail is not configured. Set AGENTMAIL_API_KEY in .env.local (get a key at https://console.agentmail.to).",
    },
    { status: 503 }
  );
}

export function agentMailRouteGuard(): NextResponse | null {
  if (!isAgentMailConfigured()) return notConfiguredResponse();
  return null;
}

export function agentMailErrorResponse(error: unknown, status = 500) {
  return NextResponse.json({ error: agentMailErrorMessage(error) }, { status });
}
