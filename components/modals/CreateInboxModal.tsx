"use client";

import { useAgentMailSync } from "@/components/settings/useAgentMailSync";
import { useSettingsStore } from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";

export function CreateInboxModal() {
  const createInboxOpen = useUiStore((s) => s.createInboxOpen);
  const createInboxStep = useUiStore((s) => s.createInboxStep);
  const createInboxUsername = useUiStore((s) => s.createInboxUsername);
  const createInboxDisplay = useUiStore((s) => s.createInboxDisplay);
  const createInboxDomain = useUiStore((s) => s.createInboxDomain);
  const createInboxError = useUiStore((s) => s.createInboxError);
  const domainPickerOpen = useUiStore((s) => s.domainPickerOpen);
  const pendingCreatedInbox = useUiStore((s) => s.pendingCreatedInbox);
  const agentMailConnection = useSettingsStore((s) => s.agentMailConnection);
  const closeCreateInbox = useUiStore((s) => s.closeCreateInbox);
  const setCreateInboxUsername = useUiStore((s) => s.setCreateInboxUsername);
  const setCreateInboxDisplay = useUiStore((s) => s.setCreateInboxDisplay);
  const setCreateInboxDomain = useUiStore((s) => s.setCreateInboxDomain);
  const setDomainPickerOpen = useUiStore((s) => s.setDomainPickerOpen);
  const setCreateInboxStep = useUiStore((s) => s.setCreateInboxStep);
  const setCreateInboxError = useUiStore((s) => s.setCreateInboxError);
  const setPendingCreatedInbox = useUiStore((s) => s.setPendingCreatedInbox);
  const addInbox = useSettingsStore((s) => s.addInbox);
  const { provisionInbox } = useAgentMailSync();

  if (!createInboxOpen) return null;

  const username = createInboxUsername.trim() || "jill-eng";
  const display = createInboxDisplay.trim() || `${username} (engineering hiring assistant)`;

  const handleCreate = async () => {
    const u = createInboxUsername.trim();
    if (!u || !/^[a-z0-9][a-z0-9-]*$/i.test(u)) {
      setCreateInboxError("Username can only contain letters, numbers, and hyphens.");
      return;
    }
    if (agentMailConnection === "not_configured") {
      setCreateInboxError("Set AGENTMAIL_API_KEY in .env.local first (see env.example).");
      return;
    }

    setCreateInboxStep("loading");
    setCreateInboxError(null);

    try {
      const inbox = await provisionInbox({
        username: u,
        domain: createInboxDomain,
        displayName: createInboxDisplay.trim() || undefined,
      });
      setPendingCreatedInbox(inbox);
      setCreateInboxStep("success");
    } catch (error) {
      setCreateInboxStep("form");
      setCreateInboxError(error instanceof Error ? error.message : "Failed to create inbox");
    }
  };

  const handleFinish = () => {
    if (pendingCreatedInbox) addInbox(pendingCreatedInbox);
    closeCreateInbox();
    setPendingCreatedInbox(null);
    setCreateInboxStep("form");
  };

  return (
    <div
      id="create-inbox-overlay"
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 300,
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={closeCreateInbox}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--panel)",
          borderRadius: 14,
          padding: 0,
          width: 480,
          maxWidth: "calc(100% - 32px)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #ea580c, #fb923c)", display: "grid", placeItems: "center", color: "white", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14 }}>
            AM
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Create new inbox</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>Provisions a new inbox in your AgentMail account</div>
          </div>
          <button type="button" className="btn-icon ghost" onClick={closeCreateInbox}>
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {createInboxStep === "form" && (
          <div id="create-inbox-form" style={{ padding: "20px 24px" }}>
            {agentMailConnection === "not_configured" ? (
              <div style={{ fontSize: 12, color: "#a16207", background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                Add <code style={{ fontFamily: "var(--mono)" }}>AGENTMAIL_API_KEY</code> to <code style={{ fontFamily: "var(--mono)" }}>.env.local</code> (copy from{" "}
                <code style={{ fontFamily: "var(--mono)" }}>env.example</code>). Get a key at{" "}
                <a href="https://console.agentmail.to" target="_blank" rel="noreferrer" style={{ color: "var(--zen)" }}>
                  console.agentmail.to
                </a>
                .
              </div>
            ) : null}
            <div className="field-grid" style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  Username
                </label>
                <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  <input
                    id="new-inbox-username"
                    className="input"
                    placeholder="e.g. jill-eng"
                    style={{ border: "none", borderRadius: 0, flex: 1 }}
                    value={createInboxUsername}
                    onChange={(e) => setCreateInboxUsername(e.target.value)}
                  />
                  <div style={{ display: "flex", alignItems: "center", padding: "0 12px", background: "var(--hover)", borderLeft: "1px solid var(--border)", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-muted)" }}>
                    @{createInboxDomain}
                  </div>
                </div>
                {createInboxError ? (
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }} id="username-error">
                    {createInboxError}
                  </div>
                ) : null}
              </div>

              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, display: "block" }}>Display name</label>
                <input id="new-inbox-display" className="input" placeholder="e.g. jill-eng (engineering hiring assistant)" value={createInboxDisplay} onChange={(e) => setCreateInboxDisplay(e.target.value)} />
              </div>

              <div className="field">
                <label style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, display: "block" }}>Domain</label>
                <div className="select-box" onClick={() => setDomainPickerOpen(!domainPickerOpen)} role="button" tabIndex={0}>
                  <span id="domain-selected">
                    {createInboxDomain}{" "}
                    <span style={{ color: "var(--ink-muted)", fontSize: 11, marginLeft: 6 }}>
                      {createInboxDomain === "agentmail.to" ? "(shared default — fastest to start)" : "(custom domain)"}
                    </span>
                  </span>
                </div>
                {domainPickerOpen && (
                  <div id="domain-options" style={{ marginTop: 4, border: "1px solid var(--border)", borderRadius: 8, padding: 4, background: "var(--panel)" }}>
                    {[
                      ["agentmail.to", "(shared default — fastest to start)"],
                      ["diy.ai", "(verified custom domain)"],
                      ["zenlabs.ai", "(verified custom domain)"],
                    ].map(([dom, note]) => (
                      <div
                        key={dom}
                        onClick={() => setCreateInboxDomain(dom)}
                        role="button"
                        tabIndex={0}
                        style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                      >
                        {dom} <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: "var(--hover)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 4 }}>Preview</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink)", fontWeight: 600 }} id="address-preview">
                  {username}@{createInboxDomain}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }} id="display-preview">
                  {display}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button type="button" className="btn-soft" onClick={closeCreateInbox}>
                Cancel
              </button>
              <button type="button" className="btn-primary" id="create-inbox-btn" onClick={() => void handleCreate()}>
                Create inbox
              </button>
            </div>
          </div>
        )}

        {createInboxStep === "loading" && (
          <div id="create-inbox-loading" style={{ padding: "40px 24px", textAlign: "center" }}>
            <svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}>
              <path d="M21 12a9 9 0 11-3.6-6.7L21 8M21 3v5h-5" />
            </svg>
            <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>Provisioning inbox in AgentMail…</div>
          </div>
        )}

        {createInboxStep === "success" && pendingCreatedInbox && (
          <div id="create-inbox-success" style={{ padding: "32px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ecfdf5", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <svg style={{ width: 24, height: 24, color: "#16a34a" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Inbox created</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }} id="success-address">
                {pendingCreatedInbox.addr} is ready to receive email
              </div>
            </div>
            <div style={{ background: "var(--hover)", borderRadius: 8, padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.6 }}>
              <div>
                <span style={{ color: "var(--ink)" }}>id:</span> {pendingCreatedInbox.inboxId}
              </div>
              <div>
                <span style={{ color: "var(--ink)" }}>address:</span> {pendingCreatedInbox.addr}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button type="button" className="btn-primary" onClick={handleFinish}>
                Use this inbox
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
