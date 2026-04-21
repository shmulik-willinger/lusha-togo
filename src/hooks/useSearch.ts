import { useInfiniteQuery } from '@tanstack/react-query';
import { searchProspects, SearchFilters, SearchContact, SearchCompany } from '../api/search';
import { useSearchStore } from '../store/searchStore';

const PAGE_SIZE = 25;

export function useSearch(filters: SearchFilters, tab: 'contacts' | 'companies', enabled: boolean) {
  const sessionId = useSearchStore((s) => s.sessionId);
  const apiSearchText = useSearchStore((s) => s.apiSearchText);
  return useInfiniteQuery({
    queryKey: ['search', tab, filters, sessionId, apiSearchText],
    queryFn: ({ pageParam = 1 }) =>
      searchProspects({ filters, page: pageParam as number, pageSize: PAGE_SIZE, tab, sessionId, searchText: apiSearchText || undefined }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function flattenContacts(pages: ReturnType<typeof useSearch>['data']): SearchContact[] {
  if (!pages) return [];
  return pages.pages.flatMap((p) => p.contacts ?? []);
}

export function flattenCompanies(pages: ReturnType<typeof useSearch>['data']): SearchCompany[] {
  if (!pages) return [];
  const seen = new Set<string>();
  return pages.pages.flatMap((p) => p.companies ?? []).filter((c) => {
    if (seen.has(c.company_lid)) return false;
    seen.add(c.company_lid);
    return true;
  });
}
