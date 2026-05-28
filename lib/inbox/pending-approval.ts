import type { ActiveRole } from "@/stores/role-store";
import type { Thread, ThreadMessage } from "@/lib/types";

export function findPendingApprovalMessage(messages: ThreadMessage[]): ThreadMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].approval) return messages[i];
  }
  return undefined;
}

export function approvalVisibleToRole(thread: Thread, role: ActiveRole): boolean {
  const approvalMsg = findPendingApprovalMessage(thread.messages);
  if (!approvalMsg) return false;
  if (role === "jill") return false;
  return approvalMsg.whispererRole === role;
}

export function threadHasPendingApproval(thread: Thread, role?: ActiveRole): boolean {
  const approvalMsg = findPendingApprovalMessage(thread.messages);
  if (!approvalMsg) return false;
  if (role && role !== "jill" && approvalMsg.whispererRole !== role) return false;
  return thread.folder === "approval" || Boolean(approvalMsg.whispererRole);
}
