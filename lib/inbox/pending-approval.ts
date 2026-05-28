import type { Thread, ThreadMessage } from "@/lib/types";

export function findPendingApprovalMessage(messages: ThreadMessage[]): ThreadMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].approval) return messages[i];
  }
  return undefined;
}

export function threadHasPendingApproval(thread: Thread): boolean {
  return thread.folder === "approval" && !!findPendingApprovalMessage(thread.messages);
}
