export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatar: string;
  /** Lowercase strings matched against thread participants and message content */
  matchTerms: string[];
}

export const ORG_USERS: OrgUser[] = [
  {
    id: "rohit",
    name: "Rohit",
    email: "rohit@zenlabs.ai",
    role: "Hiring Manager",
    initials: "R",
    avatar: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    matchTerms: ["rohit", "you", "rohit@zenlabs"],
  },
  {
    id: "devon",
    name: "Devon Singh",
    email: "devon@zenlabs.ai",
    role: "Engineering",
    initials: "D",
    avatar: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    matchTerms: ["devon singh", "devon", "devon@zenlabs"],
  },
  {
    id: "sam",
    name: "Sam Reyes",
    email: "sam@zenlabs.ai",
    role: "Engineering",
    initials: "S",
    avatar: "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    matchTerms: ["sam reyes", "sam", "sam@zenlabs"],
  },
  {
    id: "mira",
    name: "Mira",
    email: "mira@zenlabs.ai",
    role: "Product",
    initials: "M",
    avatar: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    matchTerms: ["mira", "mira@zenlabs"],
  },
  {
    id: "lakshmi",
    name: "Lakshmi",
    email: "lakshmi@zenlabs.ai",
    role: "Product",
    initials: "L",
    avatar: "linear-gradient(135deg, #f59e0b, #ec4899)",
    matchTerms: ["lakshmi", "lakshmi@zenlabs"],
  },
];

export function getOrgUser(id: string): OrgUser | undefined {
  return ORG_USERS.find((u) => u.id === id);
}
