import type { ActiveRole } from "@/stores/role-store";
import type { Thread } from "@/lib/types";

export function threadMatchesActiveRole(thread: Thread, role: ActiveRole): boolean {
  if (role === "jill") {
    if (thread.threadKind === "inbound") return true;
    return thread.threadKind === "pipeline" || !thread.threadKind;
  }

  if (thread.threadKind === "inbound") return false;

  const links = thread.inboxLinks;
  if (!links?.length) return false;
  return links.some((link) => link.role === role);
}
