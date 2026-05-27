"use client";

import { useEffect, useState } from "react";

interface ChangesHelpButtonProps {
  changes: string[];
}

export function ChangesHelpButton({ changes }: ChangesHelpButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="changes-help-fab"
        onClick={() => setOpen(true)}
        aria-label="View changes"
        title="What's new"
      >
        ?
      </button>

      {open && (
        <div className="score-dialog-overlay" onClick={() => setOpen(false)} role="presentation">
          <div
            className="score-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="changes-help-title"
          >
            <div className="score-dialog-header">
              <div>
                <div className="score-dialog-title" id="changes-help-title">
                  Changes
                </div>
                <div className="score-dialog-sub">Updates in this prototype</div>
              </div>
              <button
                type="button"
                className="btn-icon ghost"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="score-dialog-body">
              <section className="score-dialog-section">
                <ol className="changes-help-list">
                  {changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
