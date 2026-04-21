import { create } from 'zustand';
import { SearchContact } from '../api/search';

interface ContactStore {
  selectedContact: SearchContact | null;
  setSelectedContact: (contact: SearchContact | null) => void;
  // Cached recommendation leads for the recommendations detail screen
  recommendedLeads: SearchContact[];
  recommendedTotal: number;
  setRecommendedLeads: (leads: SearchContact[], total: number) => void;
  // Persist revealed contact data so state survives tab switches
  revealedContacts: Record<string, SearchContact>;
  setRevealedContact: (contact: SearchContact) => void;
  getRevealedContact: (contactId: string) => SearchContact | undefined;
  reset: () => void;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  selectedContact: null,
  setSelectedContact: (contact) => set({ selectedContact: contact }),
  recommendedLeads: [],
  recommendedTotal: 0,
  setRecommendedLeads: (leads, total) => set({ recommendedLeads: leads, recommendedTotal: total }),
  revealedContacts: {},
  setRevealedContact: (contact) =>
    set((state) => ({
      revealedContacts: { ...state.revealedContacts, [contact.contactId]: contact },
    })),
  getRevealedContact: (contactId) => get().revealedContacts[contactId],
  reset: () => set({
    selectedContact: null,
    recommendedLeads: [],
    recommendedTotal: 0,
    revealedContacts: {},
  }),
}));
