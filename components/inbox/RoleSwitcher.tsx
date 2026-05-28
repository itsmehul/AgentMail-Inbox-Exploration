"use client";

import { useRoleStore, type ActiveRole } from "@/stores/role-store";

const ROLES: { id: ActiveRole; label: string }[] = [
  { id: "jill", label: "Jill" },
  { id: "hm", label: "HM" },
  { id: "eng", label: "Eng" },
];

export function RoleSwitcher() {
  const activeRole = useRoleStore((s) => s.activeRole);
  const setActiveRole = useRoleStore((s) => s.setActiveRole);

  return (
    <div className="role-switcher" aria-label="Active account">
      {ROLES.map((role) => (
        <button
          key={role.id}
          type="button"
          className={`role-switcher-btn${activeRole === role.id ? " active" : ""}`}
          onClick={() => setActiveRole(role.id)}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
