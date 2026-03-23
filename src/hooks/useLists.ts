import { useQuery } from '@tanstack/react-query';
import { getContactLists, getContactListById } from '../api/lists';

export function useContactLists() {
  return useQuery({
    queryKey: ['contact-lists'],
    queryFn: getContactLists,
    staleTime: 2 * 60 * 1000,
  });
}

export function useContactListDetail(listId: string) {
  return useQuery({
    queryKey: ['contact-list', listId],
    queryFn: () => getContactListById(listId),
    enabled: !!listId,
    staleTime: 2 * 60 * 1000,
  });
}
