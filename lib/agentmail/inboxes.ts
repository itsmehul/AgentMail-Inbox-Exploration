import type { AgentMail } from "agentmail";

type Inbox = AgentMail.inboxes.Inbox;
import type { InboxOption } from "@/lib/types";

function formatCreatedAt(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function inboxToOption(inbox: Inbox, index = 0): InboxOption {
  const email = String(inbox.email);
  const display = inbox.displayName?.trim();
  const label = display ? `${display} · ${email}` : email;
  const created = formatCreatedAt(inbox.createdAt);

  return {
    inboxId: String(inbox.inboxId),
    addr: email,
    label,
    meta: `${index === 0 ? "Active · " : ""}Created ${created}`,
    active: index === 0,
  };
}

export function inboxesToOptions(inboxes: Inbox[]): InboxOption[] {
  return inboxes.map((inbox, i) => inboxToOption(inbox, i));
}
