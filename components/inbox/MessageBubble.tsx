"use client";

import { formatBody } from "@/lib/utils";
import type { ThreadMessage } from "@/lib/types";

export function MessageBubble({ message: m }: { message: ThreadMessage }) {
  return (
    <div className={`msg ${m.agent ? "agent" : ""}`}>
      <div className="msg-from">
        {m.from} <span className="time">{m.time}</span>
      </div>
      <div className="msg-body" style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: formatBody(m.body) }} />
      {m.caption ? (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-muted)", fontStyle: "italic" }}>{m.caption}</div>
      ) : null}
    </div>
  );
}
