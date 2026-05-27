"use client";

import { formatStageScore } from "@/lib/inbox/thread-stages";

interface CollapsedMessagesDividerProps {
  count: number;
  label: string;
  score?: number;
  expanded: boolean;
  onToggle: () => void;
  onScoreClick?: () => void;
}

export function CollapsedMessagesDivider({
  count,
  label,
  score,
  expanded,
  onToggle,
  onScoreClick,
}: CollapsedMessagesDividerProps) {
  const scoreLabel = score != null ? ` · score ${formatStageScore(score)}` : "";
  const stageLabel = `${label} · ${count} message${count === 1 ? "" : "s"}${scoreLabel}`;

  return (
    <button
      type="button"
      className="thread-collapse"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? `Hide ${stageLabel}` : `Show ${stageLabel}`}
    >
      <span className="thread-collapse-line" aria-hidden />
      <span className="thread-collapse-label">{label}</span>
      <span className="thread-collapse-trailing">
        {score != null && (
          <span
            className="thread-collapse-score thread-collapse-score-btn"
            role="button"
            tabIndex={0}
            title="View score reasoning"
            aria-label={`View ${label} score reasoning: ${formatStageScore(score)}`}
            onClick={(e) => {
              e.stopPropagation();
              onScoreClick?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                onScoreClick?.();
              }
            }}
          >
            {formatStageScore(score)}
          </span>
        )}
        <span className="thread-collapse-badge">{count}</span>
      </span>
    </button>
  );
}
