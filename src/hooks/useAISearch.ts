import { useMutation } from '@tanstack/react-query';
import { textToFilters, mapAIFiltersToSearchFilters, clientTextToFilters, clientTextToCompanyFiltersWithResidual } from '../api/aiSearch';
import { useSearchStore } from '../store/searchStore';

interface AISearchInput {
  text: string;
  tab: 'contacts' | 'companies';
}

export function useAISearch() {
  const setFilters = useSearchStore((s) => s.setFilters);
  const setQueryText = useSearchStore((s) => s.setQueryText);
  const setApiSearchText = useSearchStore((s) => s.setApiSearchText);

  return useMutation({
    mutationFn: async ({ text, tab }: AISearchInput) => {
      const response = await textToFilters(text);
      console.log('[ai-search] text-to-filters response:', JSON.stringify(response).substring(0, 600));
      const mapped = mapAIFiltersToSearchFilters(response.filters, tab);
      console.log('[ai-search] mapped filters (tab=' + tab + '):', JSON.stringify(mapped).substring(0, 400));
      return { filters: mapped, requestId: response.request_id };
    },
    onSuccess: ({ filters }, { text }) => {
      // Dashboard behaviour: the original sentence stays visible in the search
      // bar, structured filters drive the query. No searchText token-matching.
      setQueryText(text);
      setApiSearchText('');
      setFilters(filters);
    },
    onError: (err: any, { text, tab }) => {
      console.log('[ai-search] text-to-filters FAILED:', err?.response?.status, JSON.stringify(err?.response?.data ?? err?.message).substring(0, 200));
      if (tab === 'companies') {
        const { filters, residual } = clientTextToCompanyFiltersWithResidual(text);
        console.log('[ai-search] fallback — filters:', JSON.stringify(filters), '| residual:', residual);
        // Display stays the original prompt. API searchText is the residual
        // (keywords only) so the engine doesn't token-fail on literals like
        // "5000" / "employees" that we already captured structurally.
        setQueryText(text);
        setApiSearchText(residual || '');
        setFilters(filters);
      } else {
        const fallback = clientTextToFilters(text);
        setQueryText(text);
        setApiSearchText(text);
        setFilters(fallback);
      }
    },
  });
}
