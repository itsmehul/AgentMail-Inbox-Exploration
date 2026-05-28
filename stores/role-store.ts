"use client";

import { create } from "zustand";

export type ActiveRole = "jill" | "hm" | "eng";

interface RoleState {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  activeRole: "hm",
  setActiveRole: (role) => set({ activeRole: role }),
}));
