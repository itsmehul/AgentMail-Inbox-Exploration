"use client";

import type { ThreadMessage } from "@/lib/types";
import { formatBody } from "@/lib/utils";
import { useInboxStore } from "@/stores/inbox-store";
import { useState } from "react";

const AVATAR_COLORS = ["#e8719a", "#7c9af2", "#6bc77a", "#f5a623", "#9b72cb", "#56c2c2"];

function parseAddr(addr: string): { name: string; initial: string } {
  const match = addr.match(/^(.+?)\s*<.+>$/);
  const name = match ? match[1].trim() : addr.trim();
  return { name, initial: name.charAt(0).toUpperCase() || "?" };
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RecipientRow({
  label,
  list,
  field,
  threadId,
  onAdd,
  onRemove,
}: {
  label: string;
  list: string[];
  field: "to" | "cc" | "bcc";
  threadId: string;
  onAdd: (threadId: string, field: "to" | "cc" | "bcc", val: string) => void;
  onRemove: (threadId: string, field: "to" | "cc" | "bcc", idx: number) => void;
}) {
  return (
    <div className="approval-compose-row">
      <span className="approval-compose-label">{label}</span>
      <div className="approval-compose-chips">
        {list.map((addr, i) => {
          const { name, initial } = parseAddr(addr);
          return (
            <span key={`${addr}-${i}`} className="approval-compose-chip">
              <span className="approval-compose-chip-avatar" style={{ background: avatarColor(name) }}>
                {initial}
              </span>
              <span className="approval-compose-chip-name">{name}</span>
              <button
                type="button"
                className="approval-compose-chip-remove"
                aria-label={`Remove ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(threadId, field, i);
                }}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          type="text"
          className="approval-compose-chip-input"
          placeholder={list.length ? "" : "Recipients"}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== ",") return;
            e.preventDefault();
            const val = e.currentTarget.value.trim().replace(/,$/, "");
            if (!val) return;
            onAdd(threadId, field, val);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function ApprovalCard({ message: m, threadId }: { message: ThreadMessage; threadId: string }) {
  const addAddr = useInboxStore((s) => s.addAddr);
  const removeAddr = useInboxStore((s) => s.removeAddr);
  const [sent, setSent] = useState(false);

  const toList = Array.isArray(m.to) ? m.to : m.to ? [m.to] : [];
  const ccList = Array.isArray(m.cc) ? m.cc : m.cc ? [m.cc] : [];
  const bccList = Array.isArray(m.bcc) ? m.bcc : m.bcc ? [m.bcc] : [];

  const [showCc, setShowCc] = useState(ccList.length > 0);
  const [showBcc, setShowBcc] = useState(bccList.length > 0);

  return (
    <div className="msg" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
      <div className="approval-compose">
        <div className="approval-compose-header">
          <div className="approval-compose-top-row">
            <div className="approval-compose-fields">
              <RecipientRow
                label="To"
                list={toList}
                field="to"
                threadId={threadId}
                onAdd={addAddr}
                onRemove={removeAddr}
              />
              {showCc ? (
                <RecipientRow
                  label="Cc"
                  list={ccList}
                  field="cc"
                  threadId={threadId}
                  onAdd={addAddr}
                  onRemove={removeAddr}
                />
              ) : null}
              {showBcc ? (
                <RecipientRow
                  label="Bcc"
                  list={bccList}
                  field="bcc"
                  threadId={threadId}
                  onAdd={addAddr}
                  onRemove={removeAddr}
                />
              ) : null}
            </div>

            <div className="approval-compose-cc-bcc">
              {!showCc ? (
                <button type="button" onClick={() => setShowCc(true)}>
                  Cc
                </button>
              ) : null}
              {!showBcc ? (
                <button type="button" onClick={() => setShowBcc(true)}>
                  Bcc
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="approval-compose-body"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: formatBody(m.body) }}
        />

        {m.attachment ? (
          <div className="approval-compose-attachment">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-muted)" }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span style={{ fontSize: 12, fontFamily: "var(--mono)" }}>{m.attachment.name}</span>
            <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>· {m.attachment.size} · from Knowledge Base</span>
            {m.attachment.tag ? (
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", padding: "2px 6px", borderRadius: 3, background: "#ecfdf5", color: "#047857", border: "1px solid #bbf7d0" }}>
                {m.attachment.tag}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="approval-compose-toolbar">
          <button
            type="button"
            className={`approval-compose-send${sent ? " sent" : ""}`}
            disabled={sent}
            onClick={() => setSent(true)}
          >
            <span className="approval-compose-send-main">{sent ? "Sent" : "Send"}</span>
            {!sent ? (
              <span className="approval-compose-send-caret">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            ) : null}
          </button>

          <button type="button" className="approval-compose-tool" aria-label="Formatting options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Help me write">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
              <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Attach files">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Insert link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Insert emoji">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Insert files using Drive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 19h20L12 2z" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Insert photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Toggle confidential mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="Insert signature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button type="button" className="approval-compose-tool" aria-label="More options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          <span className="approval-compose-toolbar-spacer" />

          <button type="button" className="approval-compose-tool" aria-label="Discard draft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {m.caption ? <div className="approval-compose-caption">{m.caption}</div> : null}
      </div>
    </div>
  );
}
