"use client";

import { useEffect, useRef, useState } from "react";
import { CommitMemoryDialog } from "@/components/inbox/CommitMemoryDialog";
import { ComposeRecipients } from "@/components/inbox/ComposeRecipients";
import {
  describeApprovalChanges,
  getApprovalChanges,
  normalizeAddrList,
  type ApprovalSnapshot,
} from "@/lib/inbox/approval-changes";
import {
  defaultJillRecipients,
  defaultReplyRecipients,
} from "@/lib/inbox/compose-recipients";
import { JILL_COMMAND_HINTS } from "@/lib/inbox/jill-commands";
import { approvalVisibleToRole, findPendingApprovalMessage } from "@/lib/inbox/pending-approval";
import type { Thread } from "@/lib/types";
import { useInboxStore } from "@/stores/inbox-store";
import { useMemoryStore } from "@/stores/memory-store";
import { useRoleStore } from "@/stores/role-store";

type ComposeMode = "reply" | "jill";

async function postCompose(payload: {
  logicalThreadId: string;
  role: "hm" | "eng";
  mode: ComposeMode;
  text: string;
  to?: string[];
  cc?: string[];
}) {
  const res = await fetch("/api/inbox/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to send");
}

export function ThreadCompose({ thread }: { thread: Thread }) {
  const activeRole = useRoleStore((s) => s.activeRole);
  const refreshThreads = useInboxStore((s) => s.refreshThreads);
  const commitApprovalEdit = useMemoryStore((s) => s.commitApprovalEdit);

  const approvalMsg = findPendingApprovalMessage(thread.messages);
  const isApproval = approvalVisibleToRole(thread, activeRole);

  const [mode, setMode] = useState<ComposeMode>("reply");
  const [text, setText] = useState("");
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [approvalTo, setApprovalTo] = useState<string[]>([]);
  const [approvalCc, setApprovalCc] = useState<string[]>([]);
  const [approvalBcc, setApprovalBcc] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBcc, setShowBcc] = useState(false);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [pendingChangeLabels, setPendingChangeLabels] = useState<string[]>([]);

  const originalRef = useRef<ApprovalSnapshot | null>(null);
  const pendingSnapshotRef = useRef<ApprovalSnapshot | null>(null);

  useEffect(() => {
    if (isApproval && approvalMsg) {
      const draftTo = normalizeAddrList(approvalMsg.to);
      const draftCc = normalizeAddrList(approvalMsg.cc);
      const draftBcc = normalizeAddrList(approvalMsg.bcc);
      originalRef.current = {
        to: draftTo,
        cc: draftCc,
        bcc: draftBcc,
        body: approvalMsg.body ?? "",
      };
      setApprovalTo(draftTo);
      setApprovalCc(draftCc);
      setApprovalBcc(draftBcc);
      setText(approvalMsg.body ?? "");
      setShowBcc(draftBcc.length > 0);
      setError(null);
      return;
    }

    const replyDefaults = defaultReplyRecipients(thread);
    setTo(mode === "reply" ? replyDefaults.to : defaultJillRecipients(thread));
    setCc(mode === "reply" ? replyDefaults.cc : []);
    setText("");
    setError(null);
  }, [
    thread.logicalThreadId,
    thread.prospect?.email,
    thread.candidateEmail,
    thread.messages.length,
    mode,
    isApproval,
    approvalMsg?.draftId,
    approvalMsg?.body,
    approvalMsg?.when,
  ]);

  if (thread.threadKind !== "pipeline" || !thread.logicalThreadId) return null;

  const getApprovalSnapshot = (): ApprovalSnapshot => ({
    to: approvalTo,
    cc: approvalCc,
    bcc: approvalBcc,
    body: text.trim(),
  });

  const deliverApprovedDraft = async (snapshot: ApprovalSnapshot) => {
    if (!approvalMsg?.draftId) return;

    const res = await fetch("/api/inbox/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logicalThreadId: thread.logicalThreadId,
        to: snapshot.to,
        cc: snapshot.cc,
        bcc: snapshot.bcc,
        text: snapshot.body,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Send failed");
  };

  const completeApprovalSend = async (commitToMemory: boolean) => {
    const snapshot = pendingSnapshotRef.current ?? getApprovalSnapshot();
    setSending(true);
    setError(null);

    try {
      await deliverApprovedDraft(snapshot);
      if (commitToMemory && pendingSnapshotRef.current) {
        commitApprovalEdit({
          threadId: thread.id,
          subagent: approvalMsg?.sub ?? "Subagent",
          stage: approvalMsg?.stage,
          snapshot: pendingSnapshotRef.current,
        });
      }
      setMemoryDialogOpen(false);
      pendingSnapshotRef.current = null;
      try {
        await refreshThreads();
      } catch {
        /* SSE will catch up */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleApprovalSend = () => {
    if (sending) return;
    const original = originalRef.current;
    if (!original) {
      void completeApprovalSend(false);
      return;
    }

    const current = getApprovalSnapshot();
    const changes = getApprovalChanges(original, current);

    if (changes.length === 0) {
      pendingSnapshotRef.current = current;
      void completeApprovalSend(false);
      return;
    }

    pendingSnapshotRef.current = current;
    setPendingChangeLabels(describeApprovalChanges(changes));
    setMemoryDialogOpen(true);
  };

  const handleDiscard = async () => {
    if (sending || discarding || !approvalMsg?.draftId) return;

    setDiscarding(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/discard-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logicalThreadId: thread.logicalThreadId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Discard failed");
      try {
        await refreshThreads();
      } catch {
        /* SSE will catch up */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discard failed");
    } finally {
      setDiscarding(false);
    }
  };

  const handleReplySend = async () => {
    const body = text.trim();
    if (!body || sending || to.length === 0) return;
    if (activeRole !== "hm" && activeRole !== "eng") return;
    setSending(true);
    setError(null);
    try {
      await postCompose({
        logicalThreadId: thread.logicalThreadId!,
        role: activeRole,
        mode,
        text: body,
        to,
        cc: mode === "reply" ? cc : undefined,
      });
      setText("");
      try {
        await refreshThreads();
      } catch {
        /* send succeeded; SSE will catch up if refresh fails */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const canSendApproval = text.trim().length > 0 && approvalTo.length > 0 && !sending && !discarding;
  const canSendReply =
    text.trim().length > 0 && !sending && to.length > 0 && !(mode === "jill" && isApproval);

  if (isApproval && approvalMsg) {
    return (
      <>
        <div className="thread-compose thread-compose--approval">
          <div className="thread-compose-approval-header">
            <span className="thread-compose-approval-badge">Review draft</span>
            {approvalMsg.sub ? (
              <span className="thread-compose-approval-sub">{approvalMsg.sub}</span>
            ) : null}
            {approvalMsg.when ? (
              <span className="thread-compose-approval-when">{approvalMsg.when}</span>
            ) : null}
          </div>

          <div className="thread-compose-meta">
            <ComposeRecipients label="To" recipients={approvalTo} onChange={setApprovalTo} />
            <ComposeRecipients label="Cc" recipients={approvalCc} onChange={setApprovalCc} />
            {showBcc ? (
              <ComposeRecipients label="Bcc" recipients={approvalBcc} onChange={setApprovalBcc} />
            ) : (
              <div className="thread-compose-cc-bcc">
                <button type="button" onClick={() => setShowBcc(true)}>
                  Bcc
                </button>
              </div>
            )}
            {approvalMsg.whispererRole && approvalMsg.whispererRole !== "jill" ? (
              <div className="thread-compose-hint">
                Sends from {approvalMsg.whispererRole.toUpperCase()} inbox when approved
              </div>
            ) : null}
          </div>

          <textarea
            className="thread-compose-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Review draft body…"
            rows={6}
          />

          {error ? <div className="thread-compose-error">{error}</div> : null}

          <div className="thread-compose-actions thread-compose-actions--approval">
            <button
              type="button"
              className="thread-compose-discard"
              disabled={sending || discarding}
              onClick={() => void handleDiscard()}
            >
              {discarding ? "Discarding…" : "Discard"}
            </button>
            <button
              type="button"
              className="thread-compose-send thread-compose-send--approval"
              disabled={!canSendApproval}
              onClick={handleApprovalSend}
            >
              {sending ? "Sending…" : "Approve & send"}
            </button>
          </div>
        </div>

        <CommitMemoryDialog
          open={memoryDialogOpen}
          subagent={approvalMsg.sub ?? "Subagent"}
          changes={pendingChangeLabels}
          onCancel={() => {
            setMemoryDialogOpen(false);
            pendingSnapshotRef.current = null;
          }}
          onSendWithoutSaving={() => void completeApprovalSend(false)}
          onSaveAndSend={() => void completeApprovalSend(true)}
        />
      </>
    );
  }

  return (
    <div className="thread-compose">
      <div className="thread-compose-tabs">
        <button
          type="button"
          className={mode === "reply" ? "active" : ""}
          onClick={() => setMode("reply")}
        >
          Reply to thread
        </button>
        <button
          type="button"
          className={mode === "jill" ? "active" : ""}
          onClick={() => setMode("jill")}
        >
          Message Jill
        </button>
      </div>
      <div className="thread-compose-meta">
        <span className="thread-compose-role">
          Sending as <b>{activeRole.toUpperCase()}</b>
        </span>
        <ComposeRecipients
          label="To"
          recipients={to}
          onChange={setTo}
          placeholder={mode === "reply" ? "Candidate email" : "Jill email"}
        />
        {mode === "reply" ? (
          <ComposeRecipients label="Cc" recipients={cc} onChange={setCc} placeholder="Cc recipients" />
        ) : (
          <div className="thread-compose-hint">{JILL_COMMAND_HINTS}</div>
        )}
      </div>
      <textarea
        className="thread-compose-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === "reply" ? "Write a reply…" : 'e.g. "promote to take-home" or "handoff to HM"'}
        rows={3}
      />
      {error ? <div className="thread-compose-error">{error}</div> : null}
      <div className="thread-compose-actions">
        <button type="button" className="thread-compose-send" disabled={!canSendReply} onClick={handleReplySend}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
