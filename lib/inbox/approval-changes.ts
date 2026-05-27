export type ApprovalField = "to" | "cc" | "bcc" | "body";

export interface ApprovalSnapshot {
  to: string[];
  cc: string[];
  bcc: string[];
  body: string;
}

export function normalizeAddrList(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return [...v];
  if (v) return [v];
  return [];
}

export function normalizeBodyText(s: string): string {
  return s.replace(/\r\n/g, "\n").trim();
}

function listsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function getApprovalChanges(
  original: ApprovalSnapshot,
  current: ApprovalSnapshot
): ApprovalField[] {
  const changes: ApprovalField[] = [];
  if (!listsEqual(original.to, current.to)) changes.push("to");
  if (!listsEqual(original.cc, current.cc)) changes.push("cc");
  if (!listsEqual(original.bcc, current.bcc)) changes.push("bcc");
  if (normalizeBodyText(original.body) !== normalizeBodyText(current.body)) changes.push("body");
  return changes;
}

const FIELD_LABELS: Record<ApprovalField, string> = {
  to: "To recipients",
  cc: "Cc recipients",
  bcc: "Bcc recipients",
  body: "Message body",
};

export function describeApprovalChanges(changes: ApprovalField[]): string[] {
  return changes.map((c) => FIELD_LABELS[c]);
}
