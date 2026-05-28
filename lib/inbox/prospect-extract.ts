import { parseEmailAddress } from "@/lib/agentmail/config";
import type { Prospect } from "@/lib/types";

const ROLE_PATTERNS = [
  /\b(?:for|as|role:?|position:?)\s+(?:a\s+|an\s+|the\s+)?([A-Za-z][A-Za-z0-9\s/&-]{2,40}?)(?:\s+role|\s+position|\s+opening|\s+at\b|[,.]|$)/i,
  /\b(?:senior|staff|lead|principal|junior|mid[- ]level)\s+[A-Za-z][A-Za-z0-9\s/&-]{2,40}/i,
  /\b(engineer|designer|manager|developer|analyst|recruiter|candidate)\b/i,
];

const COMPANY_PATTERNS = [
  /\bat\s+([A-Za-z][A-Za-z0-9\s.&'-]{1,40}?)(?:[,.]|$|\s+(?:role|position|team))/i,
  /\bfrom\s+([A-Za-z][A-Za-z0-9\s.&'-]{1,40}?)(?:[,.]|$)/i,
];

const GENERIC_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "agentmail.to",
  "live.com",
  "proton.me",
  "protonmail.com",
]);

function companyFromDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || GENERIC_DOMAINS.has(domain)) return null;
  const label = domain.split(".")[0] ?? domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function extractRole(subject: string, body: string): string {
  const haystack = `${subject}\n${body.slice(0, 500)}`;
  for (const pattern of ROLE_PATTERNS) {
    const match = haystack.match(pattern);
    if (match) {
      const value = (match[1] ?? match[0]).trim().replace(/\s+/g, " ");
      if (value.length >= 3) return value;
    }
  }
  return "Open Role";
}

function extractCompany(subject: string, body: string, email: string): string {
  const haystack = `${subject}\n${body.slice(0, 500)}`;
  for (const pattern of COMPANY_PATTERNS) {
    const match = haystack.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, " ");
    }
  }
  return companyFromDomain(email) ?? "Unknown Company";
}

export function extractProspect(from: string, subject: string, body: string): Prospect {
  const { name, email } = parseEmailAddress(from);
  const prospectName = name || "Unknown Candidate";
  const prospectEmail = email || "unknown@example.com";

  return {
    name: prospectName,
    email: prospectEmail,
    role: extractRole(subject ?? "", body ?? ""),
    company: extractCompany(subject ?? "", body ?? "", prospectEmail),
    stage: "intro",
  };
}
