"use client";

import {
  blockReasonLabel,
  canSubmitBlockedResolution,
  getBlockedResolution,
} from "@/lib/inbox/blocked-threads";
import type { Thread } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";
import Link from "next/link";
import { useEffect, useState } from "react";

export function BlockedResolutionCard({ thread }: { thread: Thread }) {
  const resolveBlockedThread = useInboxStore((s) => s.resolveBlockedThread);
  const config = getBlockedResolution(thread);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionInput, setOptionInput] = useState("");
  const [instructions, setInstructions] = useState("");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setOptionInput("");
    setInstructions("");
    setResolved(false);
  }, [thread.id]);

  if (!config || !thread.blockReason || resolved) return null;

  const payload = {
    optionId: selectedOption ?? undefined,
    optionInput: optionInput.trim() || undefined,
    instructions: instructions.trim() || undefined,
  };

  const canSubmit = canSubmitBlockedResolution(config, payload);
  const instructionsOnly = config.instructions && !config.wizard;
  const caption = `${blockReasonLabel(thread.blockReason)} · ${thread.meta.lastAction} · held`;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (thread.logicalThreadId && payload.instructions?.trim()) {
      try {
        const res = await fetch("/api/inbox/resolve-blocked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logicalThreadId: thread.logicalThreadId,
            instructions: payload.instructions.trim(),
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to resolve");
        }
      } catch {
        return;
      }
    }
    resolveBlockedThread(thread.id, payload);
    setResolved(true);
  };

  return (
    <div className="msg agent" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
      <div className="msg-from">
        jill-diy → you <span className="time">blocked · needs input</span>
      </div>
      <div className="blocked-compose">
        <div className="blocked-compose-header">
          <div className="blocked-compose-eyebrow">{blockReasonLabel(thread.blockReason)}</div>
          <div className="blocked-compose-title">{config.title}</div>
          <div className="blocked-compose-desc">{config.description}</div>
        </div>

        {config.fixLink ? (
          <div className="blocked-compose-section">
            <Link href={config.fixLink.href} className="blocked-compose-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {config.fixLink.label}
            </Link>
            {config.fixLink.hint ? <div className="blocked-compose-link-hint">{config.fixLink.hint}</div> : null}
          </div>
        ) : null}

        {config.wizard ? (
          <div className="blocked-compose-section">
            <div className="blocked-compose-section-label">Choose how to unblock</div>
            <div className="blocked-compose-options">
              {config.wizard.options.map((option) => {
                const selected = selectedOption === option.id;
                return (
                  <label
                    key={option.id}
                    className={`blocked-compose-option${selected ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`blocked-${thread.id}`}
                      checked={selected}
                      onChange={() => setSelectedOption(option.id)}
                    />
                    <span className="blocked-compose-option-body">
                      <span className="blocked-compose-option-label">{option.label}</span>
                      {option.description ? (
                        <span className="blocked-compose-option-desc">{option.description}</span>
                      ) : null}
                      {selected && option.requiresInput ? (
                        <input
                          type="text"
                          className="blocked-compose-option-input"
                          value={optionInput}
                          onChange={(e) => setOptionInput(e.target.value)}
                          placeholder={option.inputPlaceholder}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>

            {config.wizard.allowCustomInstructions ? (
              <textarea
                className="blocked-compose-textarea"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={config.wizard.instructionsPlaceholder ?? "Add custom instructions…"}
                rows={3}
              />
            ) : null}
          </div>
        ) : null}

        {instructionsOnly ? (
          <div className="blocked-compose-section">
            <label className="blocked-compose-section-label" htmlFor={`blocked-instructions-${thread.id}`}>
              Instructions for jill
            </label>
            <textarea
              id={`blocked-instructions-${thread.id}`}
              className="blocked-compose-textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={config.instructions!.placeholder}
              rows={4}
            />
          </div>
        ) : null}

        <div className="blocked-compose-toolbar">
          <button
            type="button"
            className="blocked-compose-submit"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {instructionsOnly ? config.instructions!.submitLabel : config.submitLabel}
          </button>
          <span className="blocked-compose-toolbar-hint">
            {instructions.trim()
              ? "Custom instructions override the selected option."
              : instructionsOnly
                ? "Add instructions to continue."
                : config.wizard?.allowCustomInstructions
                  ? "Pick an option or add instructions."
                  : "Pick an option to continue."}
          </span>
        </div>

        <div className="blocked-compose-caption">{caption}</div>
      </div>
    </div>
  );
}
