import { getHmDisplayName } from "@/lib/agentmail/config";
import type { Prospect } from "@/lib/types";

export function buildAckBody(prospect: Prospect): string {
  const hmName = getHmDisplayName();
  return `Hi ${prospect.name},

Thanks for reaching out about the ${prospect.role} role${prospect.company !== "Unknown Company" ? ` at ${prospect.company}` : ""}. I'll connect you with ${hmName} shortly.

— jill-diy`;
}

export function buildIntroSubject(prospect: Prospect): string {
  return `Intro: ${prospect.name} — ${prospect.role}`;
}
