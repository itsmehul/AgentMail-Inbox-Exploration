export function escapeHtml(s: string | undefined | null): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );
}

export function formatBody(s: string | undefined): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

export function nodeDomId(key: string): string {
  return `node-${key.replace(/_/g, "-")}`;
}
