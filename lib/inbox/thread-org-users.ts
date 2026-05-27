import type { OrgUser } from "@/lib/mock/org-users";
import type { Thread } from "@/lib/types";

function collectThreadText(thread: Thread): string {
  const parts: string[] = [
    thread.from,
    thread.subject,
    thread.preview,
    ...(thread.internalComments?.map((c) => `${c.author} ${c.body}`) ?? []),
  ];

  for (const message of thread.messages) {
    if (message.from) parts.push(message.from);
    if (message.body) parts.push(message.body);
    for (const field of ["to", "cc", "bcc"] as const) {
      const value = message[field];
      if (!value) continue;
      if (Array.isArray(value)) parts.push(...value);
      else parts.push(value);
    }
  }

  return parts.join(" ").toLowerCase();
}

function textMatchesUser(text: string, user: OrgUser): boolean {
  for (const term of user.matchTerms) {
    const t = term.toLowerCase();
    if (t === "you") {
      if (/\byou\b/.test(text) || text.includes("→ you")) return true;
      continue;
    }
    if (text.includes(t)) return true;
  }
  return false;
}

export function threadInvolvesOrgUser(thread: Thread, user: OrgUser): boolean {
  const text = collectThreadText(thread);
  return textMatchesUser(text, user);
}

export function threadInvolvesAnyOrgUsers(thread: Thread, userIds: string[], users: OrgUser[]): boolean {
  if (userIds.length === 0) return true;
  const selected = users.filter((u) => userIds.includes(u.id));
  return selected.some((user) => threadInvolvesOrgUser(thread, user));
}
