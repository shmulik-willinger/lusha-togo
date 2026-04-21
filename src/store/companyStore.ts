import { create } from 'zustand';
import { SearchCompany } from '../api/search';

interface CompanyStore {
  selectedCompany: SearchCompany | null;
  setSelectedCompany: (company: SearchCompany | null) => void;
  reset: () => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  selectedCompany: null,
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  reset: () => set({ selectedCompany: null }),
}));
