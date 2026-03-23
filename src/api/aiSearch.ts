import apiClient from './client';
import { SearchFilters } from './search';

export interface TextToFiltersResponse {
  request_id: string;
  filters: {
    explicit_name?: string[];
    explicit_job_title?: string[];
    company_name?: string[];
    location?: string[];
    must_contain?: string[];
    seniority?: string[];
    department?: string[];
    employee_headcount?: { min?: number; max?: number };
    revenue?: { min?: number; max?: number };
    founded_year?: { min?: number; max?: number };
  };
}

export async function textToFilters(text: string): Promise<TextToFiltersResponse> {
  const { data } = await apiClient.post<TextToFiltersResponse>('/api/v1/text-to-filters', {
    text,
  });
  return data;
}

/**
 * Simple client-side fallback when the text-to-filters AI service is unavailable.
 * Extracts job title, location, and company name from free text using basic heuristics.
 */
export function clientTextToFilters(text: string): SearchFilters {
  const filters: SearchFilters = {};

  // Strip company/industry/location clauses to isolate the job title
  // "HR managers at SMBs in the US" → "HR managers"
  // "VP of Sales at fintech companies" → "VP of Sales"
  const jobPart = text
    .replace(/\s+(?:at|from)\s+.*/i, '')
    .replace(/\s+in\s+.*/i, '')
    .trim();

  if (jobPart && jobPart.length <= 60) {
    filters.contactJobTitle = [jobPart];
  }

  return filters;
}

/**
 * Client-side fallback for company searches when AI service is unavailable.
 * Extracts a company name hint from text using simple heuristics.
 */
export function clientTextToCompanyFilters(text: string): SearchFilters {
  // Match a real company name after "at" — only proper nouns (Title Case, not ALL-CAPS abbreviations)
  // "people at Google" → "Google"  |  "HR at SMBs" → no match (SMBs is all-caps abbrev)
  const atMatch = text.match(/\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (atMatch) return { companyName: [atMatch[1]] };

  // Extract the single word immediately before "company/companies"
  // "fintech companies" → "fintech"  |  "VP of Sales at fintech companies" → "fintech"
  const industryMatch = text.match(/\b([A-Za-z]+)\s+compan(?:y|ies)\b/i);
  if (industryMatch) return { companyIndustryLabels: [industryMatch[1]] };

  // Treat the full text as a company name search as a last resort
  const trimmed = text.trim();
  if (trimmed.length > 0 && trimmed.length <= 80) {
    return { companyName: [trimmed] };
  }
  return {};
}

/**
 * Maps the AI response filters to the SearchFilters format used by the search API.
 * Mirrors the filtersResponseMapper.js logic from lusha-prospecting-app.
 */
export function mapAIFiltersToSearchFilters(
  aiFilters: TextToFiltersResponse['filters'],
  tab: 'contacts' | 'companies' = 'contacts',
): SearchFilters {
  const mapped: SearchFilters = {};

  if (aiFilters.explicit_name?.length) {
    mapped.contactName = aiFilters.explicit_name;
  }
  if (aiFilters.explicit_job_title?.length) {
    mapped.contactJobTitle = aiFilters.explicit_job_title;
  }
  if (aiFilters.company_name?.length) {
    mapped.companyName = aiFilters.company_name;
  }
  if (aiFilters.location?.length) {
    if (tab === 'companies') {
      mapped.companyLocation = aiFilters.location;
    } else {
      mapped.contactLocation = aiFilters.location;
    }
  }
  if (aiFilters.must_contain?.length) {
    mapped.contactExistingDataPoints = aiFilters.must_contain;
  }
  if (aiFilters.seniority?.length) {
    mapped.contactSeniority = aiFilters.seniority;
  }
  if (aiFilters.department?.length) {
    mapped.contactDepartment = aiFilters.department;
  }
  if (aiFilters.employee_headcount) {
    mapped.companySize = aiFilters.employee_headcount;
  }
  if (aiFilters.revenue) {
    mapped.companyRevenue = aiFilters.revenue;
  }
  if (aiFilters.founded_year) {
    mapped.companyFoundedYear = aiFilters.founded_year;
  }

  return mapped;
}
