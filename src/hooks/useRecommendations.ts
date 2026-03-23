import { useQuery } from '@tanstack/react-query';
import { getRecommendedLeads } from '../api/recommendations';

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendedLeads,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
