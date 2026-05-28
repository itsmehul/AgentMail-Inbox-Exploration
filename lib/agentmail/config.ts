import { createAgentMailClient } from "@/lib/agentmail/client";

export type RoleInbox = "jill" | "hm" | "eng";

export function getJillInboxEmail(): string {
  const email = process.env.JILL_INBOX_EMAIL?.trim();
  if (!email) {
    throw new Error("JILL_INBOX_EMAIL is not set");
  }
  return email.toLowerCase();
}

export function getHmEmail(): string {
  const email = (process.env.HM_INBOX_EMAIL ?? process.env.HM_EMAIL)?.trim();
  if (!email) {
    throw new Error("HM_INBOX_EMAIL or HM_EMAIL is not set");
  }
  return email.toLowerCase();
}

export function getEngEmail(): string {
  const email = process.env.ENG_INBOX_EMAIL?.trim();
  if (!email) {
    throw new Error("ENG_INBOX_EMAIL is not set");
  }
  return email.toLowerCase();
}

export function getHmDisplayName(): string {
  const name = process.env.HM_DISPLAY_NAME?.trim();
  if (name) return name;
  const local = getHmEmail().split("@")[0] ?? "hm";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getEngDisplayName(): string {
  const name = process.env.ENG_DISPLAY_NAME?.trim();
  if (name) return name;
  const local = getEngEmail().split("@")[0] ?? "eng";
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function resolveInboxIdByEmail(email: string): Promise<{ inboxId: string; email: string }> {
  const normalized = email.toLowerCase();
  const client = createAgentMailClient();
  const result = await client.inboxes.list({ limit: 100 });
  const inbox = result.inboxes.find((row) => String(row.email).toLowerCase() === normalized);
  if (!inbox) {
    throw new Error(`No AgentMail inbox found for ${email}`);
  }
  return { inboxId: String(inbox.inboxId), email: String(inbox.email) };
}

export async function resolveJillInboxId(): Promise<{ inboxId: string; email: string }> {
  return resolveInboxIdByEmail(getJillInboxEmail());
}

export async function resolveHmInboxId(): Promise<{ inboxId: string; email: string }> {
  return resolveInboxIdByEmail(getHmEmail());
}

export async function resolveEngInboxId(): Promise<{ inboxId: string; email: string }> {
  return resolveInboxIdByEmail(getEngEmail());
}

export async function resolveAllRoleInboxes(): Promise<
  { role: RoleInbox; inboxId: string; email: string }[]
> {
  const [jill, hm, eng] = await Promise.all([
    resolveJillInboxId(),
    resolveHmInboxId(),
    resolveEngInboxId(),
  ]);
  return [
    { role: "jill", ...jill },
    { role: "hm", ...hm },
    { role: "eng", ...eng },
  ];
}

export function isJillAddress(addr: string, jillEmail = getJillInboxEmail()): boolean {
  const parsed = parseEmailAddress(addr);
  return parsed.email.toLowerCase() === jillEmail;
}

export function isHmAddress(addr: string, hmEmail = getHmEmail()): boolean {
  const parsed = parseEmailAddress(addr);
  return parsed.email.toLowerCase() === hmEmail;
}

export function isEngAddress(addr: string, engEmail = getEngEmail()): boolean {
  const parsed = parseEmailAddress(addr);
  return parsed.email.toLowerCase() === engEmail;
}

export function isStaffAddress(addr: string): boolean {
  try {
    const parsed = parseEmailAddress(addr);
    const email = parsed.email.toLowerCase();
    return email === getHmEmail() || email === getEngEmail();
  } catch {
    return false;
  }
}

export function parseEmailAddress(raw: string): { name: string; email: string } {
  const trimmed = raw.trim();
  const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (angle) {
    return { name: angle[1].trim().replace(/^["']|["']$/g, ""), email: angle[2].trim().toLowerCase() };
  }
  if (trimmed.includes("@")) {
    const local = trimmed.split("@")[0] ?? "contact";
    const name = local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { name, email: trimmed.toLowerCase() };
  }
  return { name: trimmed || "Unknown", email: "" };
}

export function normalizeEmailList(addrs: string[]): string[] {
  return addrs.map((addr) => parseEmailAddress(addr).email).filter(Boolean);
}

export function isJillOnlyRecipient(toAddrs: string[], jillEmail = getJillInboxEmail()): boolean {
  const emails = normalizeEmailList(toAddrs);
  return emails.length === 1 && emails[0] === jillEmail;
}
