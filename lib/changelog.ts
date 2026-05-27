export function parseChangelogFromReadme(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, ""));
}
