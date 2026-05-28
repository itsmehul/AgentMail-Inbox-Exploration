/** Reply/forward headers — content after the first match is quoted metadata. */
const QUOTE_HEADER_PATTERNS = [
  /^On .+ wrote:\s*$/im,
  /^-{2,}\s*Original Message\s*-{2,}\s*$/im,
];

const QUOTED_LINE = /^\s*>/;

export function cleanEmailBody(raw: string | undefined | null): string {
  if (!raw) return "";

  let text = raw.replace(/\r\n/g, "\n");

  let cutAt = text.length;
  for (const pattern of QUOTE_HEADER_PATTERNS) {
    const match = pattern.exec(text);
    if (match && match.index < cutAt) {
      cutAt = match.index;
    }
  }
  text = text.slice(0, cutAt);

  text = text
    .split("\n")
    .filter((line) => !QUOTED_LINE.test(line))
    .join("\n");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
