import { create } from 'zustand';
import { SearchFilters } from '../api/search';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface SearchState {
  queryText: string;
  filters: SearchFilters;
  activeTab: 'contacts' | 'companies';
  sessionId: string;
  // Actions
  setQueryText: (text: string) => void;
  setFilters: (filters: SearchFilters) => void;
  mergeFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  setActiveTab: (tab: 'contacts' | 'companies') => void;
  resetSession: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  queryText: '',
  filters: {},
  activeTab: 'contacts',
  sessionId: generateUUID(),

  setQueryText: (text) => set({ queryText: text }),

  setFilters: (filters) => set({ filters }),

  mergeFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  clearFilters: () => set({ filters: {}, queryText: '', sessionId: generateUUID() }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  resetSession: () => set({ sessionId: generateUUID() }),
}));
