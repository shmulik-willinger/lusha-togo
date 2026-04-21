import { useMutation } from '@tanstack/react-query';
import { textToFilters, mapAIFiltersToSearchFilters, clientTextToFilters, clientTextToCompanyFiltersWithResidual } from '../api/aiSearch';
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
      if (tab === 'companies') {
        const { filters, residual } = clientTextToCompanyFiltersWithResidual(text);
        console.log('[ai-search] fallback — filters:', JSON.stringify(filters), '| residual:', residual);
        // Use the stripped residual as queryText so the search engine doesn't
        // token-match on literals like "5000" or "employees" that we already
        // captured as a structured filter.
        setQueryText(residual || '');
        setFilters(filters);
      } else {
        const fallback = clientTextToFilters(text);
        setQueryText(text);
        setFilters(fallback);
      }
    },
  });
}
