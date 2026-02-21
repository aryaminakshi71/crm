import { create } from "zustand";

export interface AppState {
  currentOrganizationId: string | null;
  setCurrentOrganizationId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentOrganizationId: null,
  setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
}));
