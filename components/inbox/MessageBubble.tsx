"use client";

import { normalizeAddrList } from "@/lib/inbox/approval-changes";
import { formatBody } from "@/lib/utils";
import type { ThreadMessage } from "@/lib/types";

function RecipientLine({ label, addrs }: { label: string; addrs: string[] }) {
  if (!addrs.length) return null;
  return (
    <div className="msg-recipients-line">
      <span className="lbl">{label}</span>
      {addrs.join(", ")}
    </div>
  );
}

export function MessageBubble({ message: m }: { message: ThreadMessage }) {
  const toList = normalizeAddrList(m.to);
  const ccList = normalizeAddrList(m.cc);
  const bccList = normalizeAddrList(m.bcc);
  const hasRecipients = toList.length > 0 || ccList.length > 0 || bccList.length > 0;

  return (
    <div className={`msg ${m.agent ? "agent" : ""}${m.internal ? " msg-internal" : ""}`}>
      <div className="msg-from">
        {m.internal ? (
          <>
            <span className="msg-internal-badge">Internal → Jill</span> {m.from}
          </>
        ) : (
          m.from
        )}{" "}
        <span className="time">{m.time}</span>
      </div>
      {hasRecipients ? (
        <div className="msg-recipients">
          <RecipientLine label="To" addrs={toList} />
          <RecipientLine label="Cc" addrs={ccList} />
          <RecipientLine label="Bcc" addrs={bccList} />
        </div>
      ) : null}
      <div className="msg-body" style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: formatBody(m.body) }} />
      {m.caption ? (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-muted)", fontStyle: "italic" }}>{m.caption}</div>
      ) : null}
    </div>
  );
}
