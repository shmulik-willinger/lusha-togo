import { create } from 'zustand';
import { SearchFilters } from '../api/search';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SearchState {
  /** What the user sees in the AI search bar — always the full natural-language prompt */
  queryText: string;
  /**
   * What we actually send to /v2/prospecting-full as searchText. Usually equals
   * queryText, but the client-side fallback sets this to a reduced / empty
   * value when it already expressed the intent as structured filters — so the
   * search engine doesn't fail to token-match literals like '5000'.
   */
  apiSearchText: string;
  filters: SearchFilters;
  activeTab: 'contacts' | 'companies';
  sessionId: string;
  // Actions
  setQueryText: (text: string) => void;
  setApiSearchText: (text: string) => void;
  setFilters: (filters: SearchFilters) => void;
  mergeFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  setActiveTab: (tab: 'contacts' | 'companies') => void;
  resetSession: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  queryText: '',
  apiSearchText: '',
  filters: {},
  activeTab: 'contacts',
  sessionId: generateUUID(),

  // Default: keep apiSearchText in sync with queryText. Explicit setApiSearchText
  // can override (used by AI fallback).
  setQueryText: (text) => set({ queryText: text, apiSearchText: text }),
  setApiSearchText: (text) => set({ apiSearchText: text }),

  setFilters: (filters) => set({ filters }),

  mergeFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  clearFilters: () => set({ filters: {}, queryText: '', apiSearchText: '', sessionId: generateUUID() }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  resetSession: () => set({ sessionId: generateUUID() }),
}));
