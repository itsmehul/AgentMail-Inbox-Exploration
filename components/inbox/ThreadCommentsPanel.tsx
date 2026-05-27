"use client";

import { useEffect, useRef, useState } from "react";
import { STAGE_LABELS, STAGE_ORDER, type PipelineStage } from "@/lib/inbox/thread-stages";
import type { Thread, ThreadInternalComment } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";

function CommentsIcon() {
  return (
    <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function groupCommentsByStage(comments: ThreadInternalComment[]) {
  const buckets = new Map<PipelineStage, ThreadInternalComment[]>();
  for (const comment of comments) {
    const items = buckets.get(comment.stage) ?? [];
    items.push(comment);
    buckets.set(comment.stage, items);
  }
  return STAGE_ORDER.filter((stage) => buckets.has(stage)).map((stage) => ({
    stage,
    items: buckets.get(stage)!,
  }));
}

function stagesForThread(thread: Thread): PipelineStage[] {
  const set = new Set<PipelineStage>();
  for (const s of thread.stages) {
    if (STAGE_ORDER.includes(s as PipelineStage)) set.add(s as PipelineStage);
  }
  for (const m of thread.messages) {
    if (m.stage) set.add(m.stage);
  }
  for (const c of thread.internalComments ?? []) {
    set.add(c.stage);
  }
  return STAGE_ORDER.filter((s) => set.has(s));
}

function currentStage(thread: Thread): PipelineStage {
  const lastMessage = thread.messages.at(-1);
  if (lastMessage?.stage) return lastMessage.stage;
  const stages = stagesForThread(thread);
  return stages.at(-1) ?? "intro";
}

export function ThreadCommentsButton({
  count,
  active,
  onClick,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn-icon ghost thread-comments-btn${active ? " active" : ""}`}
      onClick={onClick}
      aria-label="Internal comments"
      aria-expanded={active}
      title="Internal comments"
    >
      <CommentsIcon />
      {count > 0 && <span className="thread-comments-count">{count}</span>}
    </button>
  );
}

export function ThreadCommentsPanel({
  thread,
  open,
  onClose,
}: {
  thread: Thread;
  open: boolean;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [stage, setStage] = useState<PipelineStage>(() => currentStage(thread));
  const addInternalComment = useInboxStore((s) => s.addInternalComment);

  const comments = thread.internalComments ?? [];
  const groups = groupCommentsByStage(comments);
  const availableStages = stagesForThread(thread);

  useEffect(() => {
    if (open) setStage(currentStage(thread));
  }, [open, thread]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, comments.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    addInternalComment(thread.id, stage, body);
    setDraft("");
  };

  if (!open) return null;

  return (
    <>
      <div className="thread-comments-backdrop" onClick={onClose} aria-hidden />
      <aside className="thread-comments-panel" aria-label="Internal comments">
        <div className="thread-comments-head">
          <div>
            <div className="thread-comments-title">Internal comments</div>
            <div className="thread-comments-sub">Only visible to your team</div>
          </div>
          <button type="button" className="btn-icon ghost" onClick={onClose} aria-label="Close comments">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="thread-comments-list" ref={listRef}>
          {!comments.length ? (
            <div className="thread-comments-empty">
              No internal notes yet. Add context for your team — comments are tied to the conversation stage.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.stage} className="thread-comments-stage-group">
                <div className="thread-comments-stage-label">{STAGE_LABELS[group.stage]}</div>
                {group.items.map((comment) => (
                  <div key={comment.id} className="internal-comment">
                    <div className="internal-comment-avatar">{comment.initials}</div>
                    <div className="internal-comment-body">
                      <div className="internal-comment-meta">
                        <span className="internal-comment-author">{comment.author}</span>
                        <span className="internal-comment-time">{comment.time}</span>
                      </div>
                      <div className="internal-comment-text">{comment.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="thread-comments-compose">
          <div className="thread-comments-compose-head">
            <span className="thread-comments-compose-label">Stage</span>
            <select
              className="thread-comments-stage-select"
              value={stage}
              onChange={(e) => setStage(e.target.value as PipelineStage)}
            >
              {availableStages.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="thread-comments-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add an internal note…"
            rows={3}
          />
          <button type="button" className="thread-comments-send" onClick={submit} disabled={!draft.trim()}>
            Comment
          </button>
        </div>
      </aside>
    </>
  );
}
