/** Strip common reply/forward prefixes for pipeline subject matching. */
export function normalizeEmailSubject(subject: string): string {
  let s = subject.trim();
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/^(?:re|fwd|fw):\s*/i, "").trim();
    if (next === s) break;
    s = next;
  }
  return s;
}

export function isPipelineIntroSubject(subject: string): boolean {
  return normalizeEmailSubject(subject).toLowerCase().startsWith("intro:");
}

export function subjectsMatchPipeline(introSubject: string, candidateSubject: string): boolean {
  return (
    normalizeEmailSubject(introSubject).toLowerCase() ===
    normalizeEmailSubject(candidateSubject).toLowerCase()
  );
}
