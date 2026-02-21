import { create } from "zustand";

export interface AuthState {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Better Auth client - use the one from lib/auth-client.ts
export { authClient } from "../lib/auth-client";
