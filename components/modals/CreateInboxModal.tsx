"use client";

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
  const pendingInboxAddr = useUiStore((s) => s.pendingInboxAddr);
  const closeCreateInbox = useUiStore((s) => s.closeCreateInbox);
  const setCreateInboxUsername = useUiStore((s) => s.setCreateInboxUsername);
  const setCreateInboxDisplay = useUiStore((s) => s.setCreateInboxDisplay);
  const setCreateInboxDomain = useUiStore((s) => s.setCreateInboxDomain);
  const setDomainPickerOpen = useUiStore((s) => s.setDomainPickerOpen);
  const submitCreateInbox = useUiStore((s) => s.submitCreateInbox);
  const finishCreateInbox = useUiStore((s) => s.finishCreateInbox);
  const addInbox = useSettingsStore((s) => s.addInbox);

  if (!createInboxOpen) return null;

  const username = createInboxUsername.trim() || "jill-eng";
  const display = createInboxDisplay.trim() || `${username} (engineering hiring assistant)`;

  const handleFinish = () => {
    const addr = finishCreateInbox();
    if (addr) addInbox(addr, display);
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
                {createInboxError && (
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }} id="username-error">
                    {createInboxError}
                  </div>
                )}
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
                    <span style={{ color: "var(--ink-muted)", fontSize: 11, marginLeft: 6 }}>(verified custom domain)</span>
                  </span>
                </div>
                {domainPickerOpen && (
                  <div id="domain-options" style={{ marginTop: 4, border: "1px solid var(--border)", borderRadius: 8, padding: 4, background: "var(--panel)" }}>
                    {[
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
              <button type="button" className="btn-primary" id="create-inbox-btn" onClick={submitCreateInbox}>
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

        {createInboxStep === "success" && (
          <div id="create-inbox-success" style={{ padding: "32px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ecfdf5", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <svg style={{ width: 24, height: 24, color: "#16a34a" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Inbox created</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }} id="success-address">
                {pendingInboxAddr} is ready to receive email
              </div>
            </div>
            <div style={{ background: "var(--hover)", borderRadius: 8, padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.6 }}>
              <div>
                <span style={{ color: "var(--ink)" }}>id:</span> ib_8a2f9c1d
              </div>
              <div>
                <span style={{ color: "var(--ink)" }}>webhook:</span> subscribed ✓
              </div>
              <div>
                <span style={{ color: "var(--ink)" }}>DKIM / SPF:</span> verified ✓
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
