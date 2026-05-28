"use client";

import { useEffect, useRef, useState } from "react";
import {
  averageStageScore,
  formatStageScore,
  groupMessagesByStage,
  STAGE_LABELS,
  type PipelineStage,
} from "@/lib/inbox/thread-stages";
import type { ThreadMessage } from "@/lib/types";
import { useFilteredThreads, useInboxStore } from "@/stores/inbox-store";
import { findThreadByAnyId } from "@/lib/inbox/resolve-merged-thread";
import { BlockedResolutionCard } from "./BlockedResolutionCard";
import { CollapsedMessagesDivider } from "./CollapsedMessagesDivider";
import { MessageBubble } from "./MessageBubble";
import { StageScoreDialog } from "./StageScoreDialog";
import { ThreadCommentsButton, ThreadCommentsPanel } from "./ThreadCommentsPanel";
import { ThreadCompose } from "./ThreadCompose";

function renderMessage(message: ThreadMessage, index: number) {
  if (message.approval) return null;
  return <MessageBubble key={`msg-${index}`} message={message} />;
}

export function ThreadDetail() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const [expandedStages, setExpandedStages] = useState<Set<PipelineStage>>(() => new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [scoreDialogStage, setScoreDialogStage] = useState<PipelineStage | null>(null);
  const activeThread = useInboxStore((s) => s.activeThread);
  const allThreads = useInboxStore((s) => s.threads);
  const threads = useFilteredThreads();
  const addUserTag = useInboxStore((s) => s.addUserTag);
  const removeUserTag = useInboxStore((s) => s.removeUserTag);

  const t = findThreadByAnyId(allThreads, activeThread) ?? threads[0];

  const threadId = t?.id ?? "";
  const messageCount = t?.messages.length ?? 0;

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = 0;
  }, [threadId, messageCount]);

  useEffect(() => {
    setExpandedStages(new Set());
    setCommentsOpen(false);
    setScoreDialogStage(null);
  }, [threadId]);

  if (!t) {
    return (
      <div className="thread-detail" id="thread-detail-content">
        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>
          Select a thread to view.
        </div>
      </div>
    );
  }

  const statusColor = t.blockReason
    ? "#dc2626"
    : t.meta.status === "awaiting approval"
      ? "#ca8a04"
      : t.meta.status === "handed off" || t.meta.status === "archived"
        ? "var(--ink-muted)"
        : t.meta.status === "awaiting candidate"
          ? "#0891b2"
          : t.meta.status === "awaiting HM"
            ? "#dc2626"
            : "#16a34a";

  const stageGroups = groupMessagesByStage(t.messages);
  const lastStage = stageGroups.at(-1)?.stage;
  const avgScore = averageStageScore(t.stageScores);

  const toggleStage = (stage: PipelineStage) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  return (
    <div
      className={`thread-detail${commentsOpen ? " thread-detail-comments-open" : ""}`}
      id="thread-detail-content"
    >
      <div className="thread-header">
        <div className="thread-header-top">
          <div className="thread-header-main">
            <div className="thread-detail-subject">{t.subject}</div>
            <div className="thread-detail-meta">
              <span>{t.id}</span>
              <span>{t.meta.msgs} messages</span>
              {t.prospect && (
                <span>
                  {t.prospect.name} · {t.prospect.role} @ {t.prospect.company}
                </span>
              )}
              {avgScore != null && <span className="thread-avg-score">{formatStageScore(avgScore)}</span>}
              <span style={{ color: statusColor }}>{t.meta.status}</span>
            </div>
          </div>
          <div className="thread-header-actions">
            <ThreadCommentsButton
              count={(t.internalComments ?? []).length}
              active={commentsOpen}
              onClick={() => setCommentsOpen((open) => !open)}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-muted)", marginRight: 4 }}>
            Your tags:
          </span>
          {(t.userTags ?? []).map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="user-tag-chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                padding: "3px 8px 3px 10px",
                borderRadius: 999,
                background: "#eef2ff",
                color: "#4338ca",
                border: "1px solid #c7d2fe",
              }}
            >
              {tag}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeUserTag(t.id, i);
                }}
                style={{ cursor: "pointer", opacity: 0.6, fontSize: 13, lineHeight: 1 }}
                role="button"
                tabIndex={0}
              >
                ×
              </span>
            </span>
          ))}
          {!(t.userTags ?? []).length && <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>none yet</span>}
          <AddTagButton threadId={t.id} onAdd={addUserTag} />
        </div>
      </div>
      <div className="thread-messages" ref={messagesRef}>
        {[...stageGroups].reverse().flatMap((group) => {
          const isLastStage = group.stage === lastStage;
          const isExpanded = isLastStage || expandedStages.has(group.stage);

          if (isLastStage) {
            const items = [...group.items]
              .reverse()
              .map(({ message, index }) => renderMessage(message, index));
            if (t.blockReason) {
              return [<BlockedResolutionCard key="blocked-resolution" thread={t} />, ...items];
            }
            return items;
          }

          const header = (
            <CollapsedMessagesDivider
              key={`${group.stage}-header`}
              count={group.items.length}
              label={STAGE_LABELS[group.stage]}
              score={t.stageScores?.[group.stage]?.score}
              expanded={isExpanded}
              onToggle={() => toggleStage(group.stage)}
              onScoreClick={
                t.stageScores?.[group.stage]
                  ? () => setScoreDialogStage(group.stage)
                  : undefined
              }
            />
          );

          if (!isExpanded) return [header];

          // Messages before header in DOM so column-reverse shows them below the divider.
          return [
            ...[...group.items].reverse().map(({ message, index }) => renderMessage(message, index)),
            header,
          ];
        })}
      </div>
      <ThreadCompose thread={t} />
      <ThreadCommentsPanel thread={t} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
      {scoreDialogStage && t.stageScores?.[scoreDialogStage] && (
        <StageScoreDialog
          open
          threadId={t.id}
          stage={scoreDialogStage}
          entry={t.stageScores[scoreDialogStage]!}
          onClose={() => setScoreDialogStage(null)}
        />
      )}
    </div>
  );
}

function AddTagButton({ threadId, onAdd }: { threadId: string; onAdd: (id: string, tag: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  if (adding) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(threadId, value.trim());
            setValue("");
            setAdding(false);
          }
          if (e.key === "Escape") setAdding(false);
        }}
        onBlur={() => setAdding(false)}
        style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, border: "1px solid var(--border)" }}
        placeholder="tag name"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setAdding(true);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 999,
        background: "white",
        color: "var(--ink-muted)",
        border: "1px dashed var(--border-strong)",
        cursor: "pointer",
      }}
    >
      <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add tag
    </button>
  );
}
