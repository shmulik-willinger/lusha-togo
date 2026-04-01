import { useQuery } from '@tanstack/react-query';
import { getRecommendedLeads, getCompanyRecommendedLeads } from '../api/recommendations';

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: getRecommendedLeads,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCompanyRecommendations() {
  return useQuery({
    queryKey: ['company-recommendations'],
    queryFn: getCompanyRecommendedLeads,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
