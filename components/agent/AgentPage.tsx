"use client";

export function AgentPage() {
  return (
    <main className="canvas-area page active" id="page-agent">
      <div className="settings-wrap">
        <h1 className="settings-h1">Agent</h1>
        <div className="settings-sub">Top-level identity and defaults for Jack.</div>
        <div className="settings-card">
          <div className="settings-card-title" style={{ marginBottom: 14 }}>
            Identity
          </div>
          <div className="field-grid">
            <div className="field">
              <label>Name</label>
              <input className="input" defaultValue="Jack — Email Agent (Candidate)" readOnly />
            </div>
            <div className="field">
              <label>Default LLM</label>
              <div className="select-box">
                <span>Claude Sonnet 4</span>
              </div>
            </div>
            <div className="field">
              <label>Default voice</label>
              <div className="select-box">
                <span className="avatar-sm" />
                <span>Hans Wilmar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
