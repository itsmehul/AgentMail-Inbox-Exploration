"use client";

import { useEffect, useState } from "react";
import { STAGE_LABELS, formatStageScore, type PipelineStage } from "@/lib/inbox/thread-stages";
import type { StageScoreEntry } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";
import { useRubricStore, useStageRubric } from "@/stores/rubric-store";

interface StageScoreDialogProps {
  open: boolean;
  threadId: string;
  stage: PipelineStage;
  entry: StageScoreEntry;
  onClose: () => void;
}

export function StageScoreDialog({ open, threadId, stage, entry, onClose }: StageScoreDialogProps) {
  const rubric = useStageRubric(stage);
  const updateStageScore = useInboxStore((s) => s.updateStageScore);
  const applyScoreFeedback = useRubricStore((s) => s.applyScoreFeedback);

  const [score, setScore] = useState(String(entry.score));
  const [updateReasoning, setUpdateReasoning] = useState("");

  useEffect(() => {
    if (open) {
      setScore(String(entry.score));
      setUpdateReasoning("");
    }
  }, [open, entry.score]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const parsedScore = parseFloat(score);
  const scoreValid = !Number.isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 10;
  const canSave = scoreValid && updateReasoning.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const rounded = Math.round(parsedScore * 10) / 10;
    updateStageScore(threadId, stage, {
      score: rounded,
      reasoning: updateReasoning.trim(),
    });
    applyScoreFeedback(threadId, stage, entry.score, rounded, updateReasoning.trim());
    onClose();
  };

  return (
    <div className="score-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="score-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-dialog-title"
      >
        <div className="score-dialog-header">
          <div>
            <div className="score-dialog-title" id="score-dialog-title">
              {STAGE_LABELS[stage]} score
            </div>
            <div className="score-dialog-sub">Review reasoning and refine the scoring rubric</div>
          </div>
          <button type="button" className="btn-icon ghost" onClick={onClose} aria-label="Close">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="score-dialog-body">
          <section className="score-dialog-section">
            <div className="score-dialog-section-label">Current score</div>
            <div className="score-dialog-current">
              <span className="score-dialog-current-value">{formatStageScore(entry.score)}</span>
              <span className="score-dialog-current-of">/ 10</span>
            </div>
          </section>

          <section className="score-dialog-section">
            <div className="score-dialog-section-label">Scoring reasoning</div>
            <p className="score-dialog-reasoning">{entry.reasoning}</p>
          </section>

          <section className="score-dialog-section">
            <div className="score-dialog-section-label">Rubric for this stage</div>
            <pre className="score-dialog-rubric">{rubric.criteria}</pre>
            {rubric.refinements.length > 0 && (
              <div className="score-dialog-refinements">
                <div className="score-dialog-section-label" style={{ marginTop: 12 }}>
                  Recent rubric updates
                </div>
                {rubric.refinements
                  .slice()
                  .reverse()
                  .slice(0, 3)
                  .map((ref) => (
                    <div key={ref.id} className="score-dialog-refinement">
                      <div className="score-dialog-refinement-meta">
                        {formatStageScore(ref.previousScore)} → {formatStageScore(ref.newScore)} · {ref.addedAt}
                      </div>
                      <div className="score-dialog-refinement-text">{ref.reasoning}</div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="score-dialog-section score-dialog-update">
            <div className="score-dialog-section-label">Update score</div>
            <div className="score-dialog-fields">
              <div className="field">
                <label htmlFor="score-input">New score (0–10)</label>
                <input
                  id="score-input"
                  className="input"
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="update-reasoning">Reasoning for update</label>
                <textarea
                  id="update-reasoning"
                  className="textarea"
                  rows={3}
                  placeholder="Explain why you're adjusting the score — this feeds back into the rubric for future threads."
                  value={updateReasoning}
                  onChange={(e) => setUpdateReasoning(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="score-dialog-footer">
          <button type="button" className="btn-soft" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={!canSave} onClick={handleSave}>
            Save &amp; update rubric
          </button>
        </div>
      </div>
    </div>
  );
}
