import { getHmDisplayName } from "@/lib/agentmail/config";
import type { Prospect } from "@/lib/types";

function formatDeadline(days = 5): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return `${deadline.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}, end of day`;
}

export function buildTakehomeBody(prospect: Prospect): string {
  const hmName = getHmDisplayName();
  const deadline = formatDeadline();

  return `Hi ${prospect.name},

Great chatting on the intro call. Here's the take-home for the ${prospect.role} role. It should take 4-6 hours of focused work; we suggest splitting across a couple of evenings.

**Deadline:** ${deadline} (5 calendar days).
**Submission:** reply to this thread with a public GitHub link.
**Questions:** Reply-all on this thread for clarifications — jill-diy is Cc'd.

Good luck — looking forward to seeing what you build.

— jill-diy on behalf of ${hmName}`;
}
