import { getHmDisplayName, getHmEmail } from "@/lib/agentmail/config";
import type { Prospect } from "@/lib/types";

export function buildIntroBody(prospect: Prospect): string {
  const hmName = getHmDisplayName();
  const hmEmail = getHmEmail();

  return `Hi ${prospect.name},

I'm jill-diy, the hiring pipeline assistant on this thread.

${hmName} (${hmEmail}) — meet ${prospect.name}, who reached out regarding the ${prospect.role} opportunity${prospect.company !== "Unknown Company" ? ` at ${prospect.company}` : ""}.

${prospect.name} — meet ${hmName}, the hiring manager.

I'm Cc'd here and can help with scheduling, take-homes, and next steps. Reply-all to keep everyone in the loop.

— jill-diy`;
}
