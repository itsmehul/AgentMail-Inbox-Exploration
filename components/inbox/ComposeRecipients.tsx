"use client";

const AVATAR_COLORS = ["#e8719a", "#7c9af2", "#6bc77a", "#f5a623", "#9b72cb", "#56c2c2"];

function parseAddr(addr: string): { name: string; initial: string } {
  const match = addr.match(/^(.+?)\s*<.+>$/);
  const name = match ? match[1].trim() : addr.trim();
  return { name, initial: name.charAt(0).toUpperCase() || "?" };
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ComposeRecipients({
  label,
  recipients,
  onChange,
  placeholder = "Recipients",
}: {
  label: string;
  recipients: string[];
  onChange: (recipients: string[]) => void;
  placeholder?: string;
}) {
  const addRecipient = (value: string) => {
    const trimmed = value.trim().replace(/,$/, "");
    if (!trimmed || recipients.includes(trimmed)) return;
    onChange([...recipients, trimmed]);
  };

  const removeRecipient = (index: number) => {
    onChange(recipients.filter((_, i) => i !== index));
  };

  return (
    <div className="approval-compose-row thread-compose-recipients">
      <span className="approval-compose-label">{label}</span>
      <div className="approval-compose-chips">
        {recipients.map((addr, i) => {
          const { name, initial } = parseAddr(addr);
          return (
            <span key={`${addr}-${i}`} className="approval-compose-chip">
              <span className="approval-compose-chip-avatar" style={{ background: avatarColor(name) }}>
                {initial}
              </span>
              <span className="approval-compose-chip-name">{name}</span>
              <button
                type="button"
                className="approval-compose-chip-remove"
                aria-label={`Remove ${name}`}
                onClick={() => removeRecipient(i)}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          type="text"
          className="approval-compose-chip-input"
          placeholder={recipients.length ? "" : placeholder}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== ",") return;
            e.preventDefault();
            addRecipient(e.currentTarget.value);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}
