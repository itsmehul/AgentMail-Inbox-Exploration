"use client";

import { useEffect } from "react";

interface CommitMemoryDialogProps {
  open: boolean;
  subagent: string;
  changes: string[];
  onCancel: () => void;
  onSendWithoutSaving: () => void;
  onSaveAndSend: () => void;
}

export function CommitMemoryDialog({
  open,
  subagent,
  changes,
  onCancel,
  onSendWithoutSaving,
  onSaveAndSend,
}: CommitMemoryDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="score-dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="score-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-dialog-title"
      >
        <div className="score-dialog-header">
          <div>
            <div className="score-dialog-title" id="memory-dialog-title">
              Save edits to memory?
            </div>
            <div className="score-dialog-sub">
              Jill will use these preferences for future drafts from {subagent}.
            </div>
          </div>
          <button type="button" className="btn-icon ghost" onClick={onCancel} aria-label="Close">
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="score-dialog-body">
          <section className="score-dialog-section">
            <div className="score-dialog-section-label">You changed</div>
            <ul className="memory-dialog-changes">
              {changes.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </section>
          <p className="score-dialog-reasoning" style={{ margin: 0 }}>
            Committing saves your edits as learned preferences so similar approval drafts start closer to
            what you approved.
          </p>
        </div>

        <div className="score-dialog-footer">
          <button type="button" className="btn-soft" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-soft" onClick={onSendWithoutSaving}>
            Send without saving
          </button>
          <button type="button" className="btn-primary" onClick={onSaveAndSend}>
            Save to memory &amp; send
          </button>
        </div>
      </div>
    </div>
  );
}
