import { useMutation } from '@tanstack/react-query';
import { textToFilters, mapAIFiltersToSearchFilters, clientTextToFilters, clientTextToCompanyFiltersWithLookup } from '../api/aiSearch';
import { useSearchStore } from '../store/searchStore';
import { SearchFilters } from '../api/search';

interface AISearchInput {
  text: string;
  tab: 'contacts' | 'companies';
}

export function useAISearch() {
  const setFilters = useSearchStore((s) => s.setFilters);
  const setQueryText = useSearchStore((s) => s.setQueryText);
  const setApiSearchText = useSearchStore((s) => s.setApiSearchText);

  return useMutation({
    mutationFn: async ({ text, tab }: AISearchInput): Promise<{ filters: SearchFilters; residual: string; usedFallback: boolean }> => {
      // Try the AI text-to-filters first
      try {
        const response = await textToFilters(text);
        console.log('[ai-search] text-to-filters response:', JSON.stringify(response).substring(0, 600));
        const mapped = mapAIFiltersToSearchFilters(response.filters, tab);
        console.log('[ai-search] mapped filters (tab=' + tab + '):', JSON.stringify(mapped).substring(0, 400));
        return { filters: mapped, residual: '', usedFallback: false };
      } catch (err: any) {
        console.log('[ai-search] text-to-filters FAILED:', err?.response?.status, JSON.stringify(err?.response?.data ?? err?.message).substring(0, 200));
        // Client-side fallback. For companies, upgrade location + industry hints
        // to real autocomplete options so the prospecting API actually accepts them.
        if (tab === 'companies') {
          const { filters, residual } = await clientTextToCompanyFiltersWithLookup(text);
          console.log('[ai-search] fallback w/lookup — filters:', JSON.stringify(filters), '| residual:', residual);
          return { filters, residual, usedFallback: true };
        }
        const fallback = clientTextToFilters(text);
        return { filters: fallback, residual: text, usedFallback: true };
      }
    },
    onSuccess: ({ filters, residual, usedFallback }, { text }) => {
      // Display always shows the original sentence the user entered / tapped.
      setQueryText(text);
      // API searchText:
      //   - AI path: empty (structured filters drive the query, like the dashboard).
      //   - Fallback path: just the residual keywords we couldn't turn into filters.
      setApiSearchText(usedFallback ? residual : '');
      setFilters(filters);
    },
  });
}
