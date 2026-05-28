"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { InboxSelector } from "./InboxSelector";
import { useAgentMailSync } from "./useAgentMailSync";

function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      ?<span className="tip-bubble">{text}</span>
    </span>
  );
}

export function SettingsPage() {
  const saveVisible = useSettingsStore((s) => s.saveVisible);
  const showSaved = useSettingsStore((s) => s.showSaved);
  const agentMailConnection = useSettingsStore((s) => s.agentMailConnection);
  const getAgentMailStatusLabel = useSettingsStore((s) => s.getAgentMailStatusLabel);
  const { syncStatus, testConnection } = useAgentMailSync();
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    void syncStatus().then(() => {
      if (useSettingsStore.getState().agentMailConnection === "connected") {
        void testConnection();
      }
    });
  }, [syncStatus, testConnection]);
  const reconcilerInterval = useSettingsStore((s) => s.reconcilerInterval);
  const cacheTtl = useSettingsStore((s) => s.cacheTtl);
  const guardianModel = useSettingsStore((s) => s.guardianModel);
  const cycleReconciler = useSettingsStore((s) => s.cycleReconciler);
  const cycleCacheTtl = useSettingsStore((s) => s.cycleCacheTtl);
  const cycleGuardianModel = useSettingsStore((s) => s.cycleGuardianModel);

  useEffect(() => {
    const handler = () => showSaved();
    document.querySelectorAll("#page-settings input, #page-settings textarea").forEach((el) => {
      el.addEventListener("change", handler);
      el.addEventListener("input", handler);
    });
    return () => {
      document.querySelectorAll("#page-settings input, #page-settings textarea").forEach((el) => {
        el.removeEventListener("change", handler);
        el.removeEventListener("input", handler);
      });
    };
  }, [showSaved]);

  return (
    <main className="canvas-area page active" id="page-settings" style={{ overflow: "auto" }}>
      <div className="settings-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="settings-h1">Settings</h1>
            <div className="settings-sub">Integrations and operational configuration for this agent.</div>
          </div>
          {saveVisible && (
            <div
              id="save-indicator"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#16a34a",
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12l5 5L20 7" />
              </svg>
              <span>Saved</span>
            </div>
          )}
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <div className="logo-am">AM</div>
            <div>
              <div className="settings-card-title">AgentMail</div>
              <div
                className="settings-card-status"
                style={{
                  color:
                    agentMailConnection === "connected"
                      ? undefined
                      : agentMailConnection === "error"
                        ? "#dc2626"
                        : "#a16207",
                }}
              >
                {getAgentMailStatusLabel()}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-soft"
                  disabled={testing}
                  onClick={async () => {
                    setTesting(true);
                    setTestMessage(null);
                    const ok = await testConnection();
                    setTestMessage(ok ? "Connection OK" : "Connection failed — see status");
                    setTesting(false);
                    showSaved();
                  }}
                >
                  {testing ? "Testing…" : "Test connection"}
                </button>
              </div>
              {testMessage ? (
                <span style={{ fontSize: 11, color: testMessage.startsWith("Connection OK") ? "#16a34a" : "#dc2626" }}>
                  {testMessage}
                </span>
              ) : null}
            </div>
          </div>
          <div className="settings-card-desc">
            Inbound emails to this address (and Ccs to multi-party threads) trigger the orchestrator. Outbound replies are sent through this inbox. The cache is updated on every webhook and reconciled every 60s as a safety net. jill-diy is stateless across threads — the email thread itself is the only context.
          </div>

          <div className="field-grid">
            <InboxSelector />
            <div className="field">
              <label>
                API key
                <Tip text="Your AgentMail API key. Used to send replies and pull thread state. Stored encrypted." />
              </label>
              <input
                className="input"
                type="password"
                value={agentMailConnection === "not_configured" ? "" : "••••••••••••••••"}
                placeholder={agentMailConnection === "not_configured" ? "Set AGENTMAIL_API_KEY in .env.local" : undefined}
                readOnly
              />
            </div>
            <div className="field">
              <label>
                Webhook URL
                <Tip text="Where AgentMail sends inbound message events. Copy this into your AgentMail dashboard." />
              </label>
              <input
                className="input"
                defaultValue={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/agentmail/webhooks`
                    : "/api/agentmail/webhooks"
                }
                readOnly
              />
              <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 6, lineHeight: 1.5 }}>
                One webhook URL for all Jill, HM, and Eng inboxes.
              </div>
            </div>
            <div className="field">
              <label>
                Webhook signing secret
                <Tip text="Verifies that incoming webhooks really came from AgentMail. Rotate if compromised." />
              </label>
              <input className="input" type="password" defaultValue="••••••••••••whsec_4f29c" readOnly />
            </div>
            <div className="field">
              <label>
                Sender display name
                <Tip text={'The "From" name candidates and HMs see in their inbox.'} />
              </label>
              <input className="input" defaultValue="jill-diy (hiring assistant)" />
            </div>
            <div className="field">
              <label>
                Reply signature
                <Tip text="Appended to every outbound email." />
              </label>
              <textarea className="textarea" style={{ minHeight: 70 }} defaultValue={`— jill-diy on behalf of {{hm_name}}\nCc'd: {{hm_email}} · Reply-all to keep me in the loop.`} />
            </div>
            <div className="field">
              <label>
                Reconciler interval
                <Tip text="How often we poll AgentMail for messages we may have missed (e.g. webhook downtime)." />
              </label>
              <div className="select-box" onClick={cycleReconciler} onKeyDown={(e) => e.key === "Enter" && cycleReconciler()} role="button" tabIndex={0}>
                <span>{reconcilerInterval}</span>
              </div>
            </div>
            <div className="field">
              <label>
                Cache TTL
                <Tip text="How long thread data is kept in our Postgres cache before refreshing from AgentMail." />
              </label>
              <div className="select-box" onClick={cycleCacheTtl} onKeyDown={(e) => e.key === "Enter" && cycleCacheTtl()} role="button" tabIndex={0}>
                <span>{cacheTtl}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-head">
            <div className="logo-am" style={{ background: "linear-gradient(135deg, #db2777, #ec4899)" }}>
              G
            </div>
            <div>
              <div className="settings-card-title">Guardrails</div>
              <div className="settings-card-status">Pre-draft checks · applies to every subagent</div>
            </div>
          </div>
          <div className="settings-card-desc">
            Every candidate-facing draft passes through Guardian before it appears in the Inbox for your approval.
          </div>

          <div className="field-grid">
            <div className="field">
              <label>
                Guardian model
                <Tip text="The model that reviews every draft. Haiku is fast and cheap and works well for policy checks." />
              </label>
              <div className="select-box" onClick={cycleGuardianModel} onKeyDown={(e) => e.key === "Enter" && cycleGuardianModel()} role="button" tabIndex={0}>
                <span>{guardianModel}</span>
              </div>
            </div>
            <div className="field">
              <label>
                Default checks
                <Tip text="Which checks run on every draft." />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input type="checkbox" defaultChecked readOnly /> PII scan
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input type="checkbox" defaultChecked readOnly /> Factual claims must cite KB or thread
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input type="checkbox" defaultChecked readOnly /> Tone &amp; brand voice
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input type="checkbox" /> Profanity filter
                </label>
              </div>
            </div>
            <div className="field">
              <label>
                Reply idempotency window
                <Tip text="If the same thread+turn produces multiple drafts (retries, races), only send once within this window." />
              </label>
              <div className="select-box">
                <span>5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
