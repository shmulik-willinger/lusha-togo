import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'lusha_session';

export interface SessionData {
  cookie: string;       // full cookie string captured from WebView
  pxCookie?: string;    // PerimeterX anti-bot token from localStorage
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  creditsUsed?: number;
  creditsTotal?: number;
}

interface AuthState {
  session: SessionData | null;
  isLoading: boolean;
  // Actions
  loadSession: () => Promise<void>;
  setSession: (session: SessionData) => Promise<void>;
  clearSession: () => Promise<void>;
  updateCredits: (used: number, total: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw) as SessionData;
        set({ session, isLoading: false });
      } else {
        set({ session: null, isLoading: false });
      }
    } catch {
      set({ session: null, isLoading: false });
    }
  },

  setSession: async (session: SessionData) => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    set({ session });
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    set({ session: null });
  },

  updateCredits: (creditsUsed: number, creditsTotal: number) => {
    set((state) =>
      state.session ? { session: { ...state.session, creditsUsed, creditsTotal } } : {},
    );
  },
}));
