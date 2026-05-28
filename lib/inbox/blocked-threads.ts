import { JILL_COMMAND_HINTS } from "@/lib/inbox/jill-commands";
import type {
  BlockReason,
  BlockedResolutionConfig,
  BlockResolutionPayload,
  PipelineStageId,
  Thread,
} from "@/lib/types";

export function isBlockedThread(thread: Thread): boolean {
  return thread.blockReason != null;
}

export function blockReasonLabel(reason: BlockReason): string {
  switch (reason) {
    case "unclear_intent":
      return "Unclear how to respond";
    case "delegation_stuck":
      return "Delegation stuck";
    case "failure":
      return "Send failure";
  }
}

export function getBlockedResolution(thread: Thread): BlockedResolutionConfig | null {
  if (!thread.blockReason) return null;

  switch (thread.id) {
    case "thr_blocked_01":
      return {
        title: "Orchestrator couldn't pick a route",
        description:
          "Kenji asked about remote work and on-call. Your note to pause wasn't clear enough for jill to delegate.",
        fixLink: {
          label: "Edit routing edges in Workflow",
          href: "/workflow",
          hint: "Tune orchestrator conditions so pauses and candidate questions route correctly.",
        },
        wizard: {
          options: [
            {
              id: "answer-candidate",
              label: "Answer Kenji's questions in-thread",
              description: "jill drafts a reply covering remote policy and on-call rotation.",
            },
            {
              id: "hold",
              label: "Hold — I'll reply to Kenji myself",
              description: "Pause jill until you respond in the thread.",
            },
            {
              id: "status-reporter",
              label: "Route to Status Reporter",
              description: "Send you a read-only summary; no reply to Kenji yet.",
            },
          ],
          allowCustomInstructions: true,
          instructionsPlaceholder: "Or tell jill exactly what to do…",
        },
        submitLabel: "Unblock & continue",
      };

    case "thr_blocked_02":
      return {
        title: "Guardian rejected the attachment tag",
        description:
          "Take-home Sender tried 3 times. Guardian won't approve \"HM-approved\" without a matching approval record.",
        fixLink: {
          label: "Review Guardian rules in Settings",
          href: "/settings",
          hint: "Adjust attachment-tag checks or Guardian model under operational config.",
        },
        wizard: {
          options: [
            {
              id: "tag-draft",
              label: "Retry with \"draft\" tag",
              description: "Send the take-home without the HM-approved stamp.",
            },
            {
              id: "tag-approved",
              label: "Override — mark as HM-approved",
              description: "Record your approval on this thread and retry send.",
            },
            {
              id: "replace-attachment",
              label: "Swap attachment from Knowledge Base",
              description: "Pick a different take-home PDF that already has valid metadata.",
            },
          ],
          allowCustomInstructions: true,
          instructionsPlaceholder: "Custom instructions for Take-home Sender…",
        },
        submitLabel: "Unblock & retry send",
      };

    case "thr_blocked_03":
      return {
        title: "Code review scheduler is stuck",
        description: "Jamie hasn't picked a slot after 3 auto-nudges. jill won't send another without your call.",
        wizard: {
          options: [
            {
              id: "nudge-jamie",
              label: "Send one more nudge to Jamie",
              description: "Final automated bump with the same slot options.",
            },
            {
              id: "backup-reviewer",
              label: "Name a backup reviewer",
              description: "jill will invite them instead of Jamie.",
              requiresInput: true,
              inputPlaceholder: "e.g. Sam Reyes <sam@zenlabs.ai>",
            },
            {
              id: "hm-handles",
              label: "I'll reach out to Jamie directly",
              description: "Pause scheduler; you'll coordinate offline.",
            },
          ],
        },
        submitLabel: "Unblock scheduler",
      };

    case "thr_blocked_04":
      return {
        title: "AgentMail send failed",
        description: "Intro Setter got 503 Service Unavailable twice after you approved the draft.",
        fixLink: {
          label: "Check AgentMail connection in Settings",
          href: "/settings",
          hint: "Verify inbox status and retry limits under AgentMail integration.",
        },
        wizard: {
          options: [
            {
              id: "retry-now",
              label: "Retry send now",
              description: "Push the preserved draft to AgentMail immediately.",
            },
            {
              id: "queue-retry",
              label: "Queue retry in 15 minutes",
              description: "Automatic retry if the outage clears.",
            },
            {
              id: "manual-send",
              label: "Discard draft — I'll send manually",
              description: "Remove jill's draft; you take over the thread.",
            },
          ],
        },
        submitLabel: "Resolve & continue",
      };

    default:
      return fallbackResolution(thread.blockReason);
  }
}

function fallbackResolution(reason: BlockReason): BlockedResolutionConfig {
  if (reason === "unclear_intent") {
    return {
      title: "Jill didn't understand the command",
      description: `The message to Jill didn't match a known action. ${JILL_COMMAND_HINTS}`,
      instructions: {
        placeholder: 'Rephrase, e.g. "promote to take-home" or "handoff to HM"…',
        submitLabel: "Send to Jill",
      },
      submitLabel: "Retry command",
    };
  }

  if (reason === "failure") {
    return {
      title: "Something failed during send",
      description: "An integration or subagent error stopped this thread.",
      fixLink: { label: "Open Settings", href: "/settings" },
      wizard: {
        options: [{ id: "retry-now", label: "Retry now", description: "Attempt the last action again." }],
      },
      submitLabel: "Retry",
    };
  }

  return {
    title: "Delegation is stuck",
    description: "A subagent loop exhausted retries without completing.",
    fixLink: { label: "Open Workflow", href: "/workflow" },
    instructions: {
      placeholder: "Add instructions to unblock…",
      submitLabel: "Apply instructions",
    },
    submitLabel: "Unblock",
  };
}

function resolutionSummary(thread: Thread, payload: BlockResolutionPayload): string {
  const config = getBlockedResolution(thread);
  const option = config?.wizard?.options.find((o) => o.id === payload.optionId);
  const custom = payload.instructions?.trim();

  if (custom) return `Following your instructions: ${custom}`;
  if (option?.requiresInput && payload.optionInput?.trim()) {
    return `${option.label}: ${payload.optionInput.trim()}`;
  }
  if (option) return option.label;
  if (payload.instructions?.trim()) return payload.instructions.trim();
  return "Continuing with your resolution.";
}

function nextFolder(thread: Thread, payload: BlockResolutionPayload): string {
  switch (thread.id) {
    case "thr_blocked_01":
      if (payload.optionId === "hold" || payload.optionId === "status-reporter") return "awaiting_hm";
      return "awaiting_candidate";
    case "thr_blocked_02":
      return "awaiting_candidate";
    case "thr_blocked_03":
      if (payload.optionId === "hm-handles") return "awaiting_hm";
      return "awaiting_candidate";
    case "thr_blocked_04":
      if (payload.optionId === "manual-send") return "awaiting_hm";
      return "awaiting_candidate";
    default:
      return thread.folder === "blocked" ? "awaiting_candidate" : thread.folder;
  }
}

function nextStatus(thread: Thread, payload: BlockResolutionPayload): string {
  switch (thread.id) {
    case "thr_blocked_01":
      if (payload.optionId === "hold") return "awaiting HM";
      if (payload.optionId === "status-reporter") return "sent";
      return "awaiting candidate";
    case "thr_blocked_02":
      return "awaiting candidate";
    case "thr_blocked_03":
      if (payload.optionId === "hm-handles") return "awaiting HM";
      return "awaiting candidate";
    case "thr_blocked_04":
      if (payload.optionId === "manual-send") return "awaiting HM";
      if (payload.optionId === "queue-retry") return "queued retry";
      return "awaiting candidate";
    default:
      return "in progress";
  }
}

function nextPreview(thread: Thread, payload: BlockResolutionPayload): string {
  const summary = resolutionSummary(thread, payload);
  return `Unblocked — ${summary}`;
}

export function applyBlockedResolution(thread: Thread, payload: BlockResolutionPayload): Thread {
  const summary = resolutionSummary(thread, payload);
  const stage = (thread.stages.at(-1) ?? "intro") as PipelineStageId;
  const lastAction = thread.meta.lastAction;

  return {
    ...thread,
    folder: nextFolder(thread, payload),
    blockReason: undefined,
    preview: nextPreview(thread, payload),
    meta: {
      ...thread.meta,
      msgs: thread.meta.msgs + 1,
      status: nextStatus(thread, payload),
      lastAction,
    },
    messages: [
      ...thread.messages,
      {
        from: "jill-diy → you",
        time: "just now",
        stage,
        agent: true,
        body: `Unblocked. ${summary}\n\nResuming ${lastAction} on this thread.`,
        caption: `${lastAction} · resumed after your input`,
      },
    ],
  };
}

export function canSubmitBlockedResolution(
  config: BlockedResolutionConfig,
  payload: BlockResolutionPayload
): boolean {
  const hasInstructions = Boolean(payload.instructions?.trim());
  if (hasInstructions) return true;

  if (config.instructions && !config.wizard) {
    return hasInstructions;
  }

  if (!payload.optionId) return false;

  const option = config.wizard?.options.find((o) => o.id === payload.optionId);
  if (option?.requiresInput) {
    return Boolean(payload.optionInput?.trim());
  }

  return true;
}
