import { useMutation } from '@tanstack/react-query';
import { textToFilters, mapAIFiltersToSearchFilters, clientTextToFilters, clientTextToCompanyFilters } from '../api/aiSearch';
import { useSearchStore } from '../store/searchStore';

interface AISearchInput {
  text: string;
  tab: 'contacts' | 'companies';
}

export function useAISearch() {
  const { setFilters, setQueryText } = useSearchStore();

  return useMutation({
    mutationFn: async ({ text, tab }: AISearchInput) => {
      const response = await textToFilters(text);
      console.log('[ai-search] text-to-filters response:', JSON.stringify(response).substring(0, 600));
      const mapped = mapAIFiltersToSearchFilters(response.filters, tab);
      console.log('[ai-search] mapped filters (tab=' + tab + '):', JSON.stringify(mapped).substring(0, 400));
      return { filters: mapped, requestId: response.request_id };
    },
    onSuccess: ({ filters }, { text }) => {
      setQueryText(text);
      setFilters(filters);
    },
    onError: (err: any, { text, tab }) => {
      console.log('[ai-search] text-to-filters FAILED:', err?.response?.status, JSON.stringify(err?.response?.data ?? err?.message).substring(0, 200));
      const fallback = tab === 'companies' ? clientTextToCompanyFilters(text) : clientTextToFilters(text);
      console.log('[ai-search] client fallback filters (tab=' + tab + '):', JSON.stringify(fallback));
      setQueryText(text);
      setFilters(fallback);
    },
  });
}
