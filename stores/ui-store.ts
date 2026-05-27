"use client";

import { create } from "zustand";

type CreateInboxStep = "form" | "loading" | "success";

interface UiState {
  inboxDropdownOpen: boolean;
  createInboxOpen: boolean;
  createInboxStep: CreateInboxStep;
  createInboxUsername: string;
  createInboxDisplay: string;
  createInboxDomain: string;
  createInboxError: string | null;
  domainPickerOpen: boolean;
  pendingInboxAddr: string | null;
  setInboxDropdownOpen: (open: boolean) => void;
  openCreateInbox: () => void;
  closeCreateInbox: () => void;
  setCreateInboxUsername: (v: string) => void;
  setCreateInboxDisplay: (v: string) => void;
  setCreateInboxDomain: (domain: string) => void;
  setDomainPickerOpen: (open: boolean) => void;
  submitCreateInbox: () => void;
  finishCreateInbox: () => string | null;
}

export const useUiStore = create<UiState>((set, get) => ({
  inboxDropdownOpen: false,
  createInboxOpen: false,
  createInboxStep: "form",
  createInboxUsername: "",
  createInboxDisplay: "",
  createInboxDomain: "diy.ai",
  createInboxError: null,
  domainPickerOpen: false,
  pendingInboxAddr: null,
  setInboxDropdownOpen: (open) => set({ inboxDropdownOpen: open }),
  openCreateInbox: () =>
    set({
      createInboxOpen: true,
      createInboxStep: "form",
      createInboxUsername: "",
      createInboxDisplay: "",
      createInboxError: null,
      inboxDropdownOpen: false,
    }),
  closeCreateInbox: () => set({ createInboxOpen: false }),
  setCreateInboxUsername: (v) => set({ createInboxUsername: v, createInboxError: null }),
  setCreateInboxDisplay: (v) => set({ createInboxDisplay: v }),
  setCreateInboxDomain: (domain) => set({ createInboxDomain: domain, domainPickerOpen: false }),
  setDomainPickerOpen: (open) => set({ domainPickerOpen: open }),
  submitCreateInbox: () => {
    const u = get().createInboxUsername.trim();
    if (!u || !/^[a-z0-9][a-z0-9-]*$/i.test(u)) {
      set({
        createInboxError: "Username can only contain letters, numbers, and hyphens.",
      });
      return;
    }
    set({ createInboxStep: "loading", createInboxError: null });
    const domain = get().createInboxDomain;
    const addr = `${u}@${domain}`;
    setTimeout(() => {
      set({
        createInboxStep: "success",
        pendingInboxAddr: addr,
      });
    }, 1100);
  },
  finishCreateInbox: () => {
    const addr = get().pendingInboxAddr;
    set({ createInboxOpen: false, pendingInboxAddr: null });
    return addr;
  },
}));
