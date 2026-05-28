"use client";

import { create } from "zustand";
import type { InboxOption } from "@/lib/types";

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
  pendingCreatedInbox: InboxOption | null;
  setInboxDropdownOpen: (open: boolean) => void;
  openCreateInbox: () => void;
  closeCreateInbox: () => void;
  setCreateInboxUsername: (v: string) => void;
  setCreateInboxDisplay: (v: string) => void;
  setCreateInboxDomain: (domain: string) => void;
  setDomainPickerOpen: (open: boolean) => void;
  setCreateInboxStep: (step: CreateInboxStep) => void;
  setCreateInboxError: (error: string | null) => void;
  setPendingCreatedInbox: (inbox: InboxOption | null) => void;
  resetCreateInboxForm: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  inboxDropdownOpen: false,
  createInboxOpen: false,
  createInboxStep: "form",
  createInboxUsername: "",
  createInboxDisplay: "",
  createInboxDomain: "agentmail.to",
  createInboxError: null,
  domainPickerOpen: false,
  pendingCreatedInbox: null,
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
  setCreateInboxStep: (createInboxStep) => set({ createInboxStep }),
  setCreateInboxError: (createInboxError) => set({ createInboxError }),
  setPendingCreatedInbox: (pendingCreatedInbox) => set({ pendingCreatedInbox }),
  resetCreateInboxForm: () =>
    set({
      createInboxStep: "form",
      createInboxUsername: "",
      createInboxDisplay: "",
      createInboxDomain: "agentmail.to",
      createInboxError: null,
      pendingCreatedInbox: null,
    }),
}));
