import { normalizeAddrList } from "@/lib/inbox/approval-changes";
import type { Thread } from "@/lib/types";

function extractEmail(addr: string): string {
  const match = addr.match(/<([^>]+)>/);
  return (match?.[1] ?? addr).trim().toLowerCase();
}

function isLikelyStaffEmail(email: string): boolean {
  const normalized = email.toLowerCase();
  if (normalized.endsWith("@agentmail.to")) return true;
  const local = normalized.split("@")[0] ?? "";
  return /^(jill|hm|eng)[-_.]?/i.test(local);
}

function jillEmailFallback(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_JILL_INBOX_EMAIL?.trim().toLowerCase();
  return fromEnv || undefined;
}

export function findCandidateEmail(thread: Thread): string | undefined {
  const prospectEmail = thread.prospect?.email?.trim().toLowerCase();
  if (prospectEmail && prospectEmail !== "unknown@example.com") return prospectEmail;

  const stored = thread.candidateEmail?.trim().toLowerCase();
  if (stored) return stored;

  const fromHeader = extractEmail(thread.from);
  if (fromHeader.includes("@") && !isLikelyStaffEmail(fromHeader)) return fromHeader;

  for (const message of thread.messages) {
    if (!message.from || message.agent) continue;
    const email = extractEmail(message.from);
    if (email.includes("@") && !isLikelyStaffEmail(email)) return email;
  }

  return undefined;
}

export function findJillAddress(thread: Thread): string | undefined {
  for (const message of [...thread.messages].reverse()) {
    for (const addr of [
      ...normalizeAddrList(message.cc),
      ...normalizeAddrList(message.to),
      ...normalizeAddrList(message.from),
    ]) {
      if (/jill/i.test(addr)) return extractEmail(addr);
    }
    if (message.agent && message.from) return extractEmail(message.from);
  }

  return jillEmailFallback();
}

export function isThreadHandedOff(thread: Thread): boolean {
  return thread.folder === "handed_off";
}

export function defaultReplyRecipients(thread: Thread): { to: string[]; cc: string[] } {
  const candidate = findCandidateEmail(thread);
  const jill = findJillAddress(thread);
  const includeJill = !isThreadHandedOff(thread);
  return {
    to: candidate ? [candidate] : [],
    cc: includeJill && jill ? [jill] : [],
  };
}

export function defaultJillRecipients(thread: Thread): string[] {
  const jill = findJillAddress(thread);
  return jill ? [jill] : [];
}

export function parseRecipientInput(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((entry) => String(entry).trim()).filter(Boolean);
  return list.length ? list : undefined;
}
