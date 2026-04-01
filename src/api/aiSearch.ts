import apiClient from './client';
import { SearchFilters } from './search';
import { CompanyNameOption, LocationOption } from './filters';

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
 * Always returns empty filters — relies on searchText to carry the full natural language
 * query to the Lusha search engine. Structured filters (job title, seniority, etc.)
 * over-constrain the query and often return masked/empty results for this account.
 */
export function clientTextToFilters(_text: string): SearchFilters {
  return {};
}


/**
 * Client-side fallback for company searches when AI service is unavailable.
 * Extracts industry, size, and location from free text using basic heuristics.
 */
export function clientTextToCompanyFilters(text: string): SearchFilters {
  const trimmed = text.trim();

  // Short text (≤ 4 chars) is likely an abbreviation (AWS, IBM, SAP...).
  if (trimmed.length <= 4) return {};

  // Match a real company name after "at" — only proper nouns (Title Case, not ALL-CAPS abbreviations)
  const atMatch = text.match(/\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (atMatch) return { companyName: [{ name: atMatch[1] } as CompanyNameOption] };

  const result: SearchFilters = {};

  // Don't set structured location/size filters here — they often produce empty results
  // because the API returns total>0 but results:[] for company searches.
  // Let searchText carry the full natural language query instead.

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
    mapped.companyName = aiFilters.company_name.map((n) => ({ name: n } as CompanyNameOption));
  }
  if (aiFilters.location?.length) {
    const locationObjs: LocationOption[] = aiFilters.location.map((l) => ({ name: l } as LocationOption));
    if (tab === 'companies') {
      mapped.companyLocation = locationObjs;
    } else {
      mapped.contactLocation = locationObjs;
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
