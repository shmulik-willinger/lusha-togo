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
 * Client-side fallback for company searches when Lusha's text-to-filters AI
 * service is unavailable (503 / network error).
 *
 * The prospecting API's free-text matcher token-splits the query and requires
 * hits on most tokens — so "Consulting companies with 5000 employees from
 * India" token-matches literally on "5000" and "employee" and returns zero.
 * To mirror what the AI service would do, we parse out common structured
 * hints (size / location / founded year / revenue) and strip them from the
 * free text, leaving just the topical keywords for searchText.
 *
 * When called from useAISearch, the stripped residual is written back as
 * queryText so the search engine doesn't match on literals like "5000".
 */
export function clientTextToCompanyFiltersWithResidual(text: string): { filters: SearchFilters; residual: string } {
  const { filters, residual } = extractCompanyFilters(text);
  return { filters, residual };
}

export function clientTextToCompanyFilters(text: string): SearchFilters {
  return extractCompanyFilters(text).filters;
}

function extractCompanyFilters(text: string): { filters: SearchFilters; residual: string } {
  const trimmed = text.trim();
  if (trimmed.length <= 4) return { filters: {}, residual: trimmed };

  // Match a real company name after "at" — only proper nouns
  const atMatch = text.match(/\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (atMatch) return {
    filters: { companyName: [{ name: atMatch[1] } as CompanyNameOption] },
    residual: text.replace(atMatch[0], ' ').trim(),
  };

  const result: SearchFilters = {};
  let residual = text;

  // --- Company size ---
  // "5000 employees", "5,000 employees", "5k employees", "500-1000 employees",
  // "with 5000+", "100M+" (treated as revenue below).
  const sizeRange = residual.match(/\b(\d[\d,]*)\s*[-–—]\s*(\d[\d,]*)\s*(?:employees?|people|staff)\b/i);
  const sizeSingle = residual.match(/\b(\d[\d,.]*)\s*(k|m)?\+?\s*(?:employees?|people|staff)\b/i);
  const parseN = (s: string, suffix?: string): number => {
    const n = Number(s.replace(/,/g, ''));
    if (!Number.isFinite(n)) return 0;
    if (suffix?.toLowerCase() === 'k') return Math.round(n * 1_000);
    if (suffix?.toLowerCase() === 'm') return Math.round(n * 1_000_000);
    return Math.round(n);
  };
  // Lusha's prospecting API only accepts these predefined size buckets.
  // Snap any free-form range/number to the bucket that best contains it.
  const SIZE_BUCKETS: Array<{ min: number; max: number }> = [
    { min: 1,      max: 10 },
    { min: 11,     max: 50 },
    { min: 51,     max: 200 },
    { min: 201,    max: 500 },
    { min: 501,    max: 1000 },
    { min: 1001,   max: 5000 },
    { min: 5001,   max: 10000 },
    { min: 10001,  max: 100000 },
    { min: 100001, max: 1000000 },
  ];
  const bucketFor = (n: number): { min: number; max: number } | undefined =>
    SIZE_BUCKETS.find((b) => n >= b.min && n <= b.max);
  if (sizeRange) {
    const low  = parseN(sizeRange[1]);
    const high = parseN(sizeRange[2]);
    const b = bucketFor(low) ?? bucketFor(high);
    if (b) result.companySize = b;
    residual = residual.replace(sizeRange[0], ' ');
  } else if (sizeSingle) {
    const n = parseN(sizeSingle[1], sizeSingle[2]);
    const b = bucketFor(n);
    if (b) result.companySize = b;
    residual = residual.replace(sizeSingle[0], ' ');
  }

  // --- Founded year ---
  // "founded after 2015", "founded in 2010", "since 2020"
  const foundedAfter = residual.match(/\b(?:founded\s+(?:after|since)|since)\s+(\d{4})\b/i);
  const foundedBefore = residual.match(/\bfounded\s+before\s+(\d{4})\b/i);
  const foundedIn = residual.match(/\bfounded\s+in\s+(\d{4})\b/i);
  if (foundedAfter) {
    result.companyFoundedYear = { min: Number(foundedAfter[1]) };
    residual = residual.replace(foundedAfter[0], ' ');
  } else if (foundedBefore) {
    result.companyFoundedYear = { max: Number(foundedBefore[1]) };
    residual = residual.replace(foundedBefore[0], ' ');
  } else if (foundedIn) {
    const y = Number(foundedIn[1]);
    result.companyFoundedYear = { min: y, max: y };
    residual = residual.replace(foundedIn[0], ' ');
  }

  // --- Revenue ---
  // "100M+ revenue", "$10B revenue", "$50M in revenue"
  const revRange = residual.match(/\$?(\d[\d,.]*)\s*(m|b|k)\+?\s*(?:in\s+)?revenue\b/i);
  if (revRange) {
    const n = parseN(revRange[1], revRange[2]);
    if (n > 0) result.companyRevenue = { min: n };
    residual = residual.replace(revRange[0], ' ');
  }

  // --- Location ---
  // "from India", "in United States", "based in Germany"
  const locMatch = residual.match(/\b(?:from|in|based\s+in)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/);
  if (locMatch) {
    const name = locMatch[1];
    // Skip common non-locations
    if (!/^(With|And|Or|The)$/i.test(name)) {
      result.companyLocation = [{ name, key: 'country' } as LocationOption];
      residual = residual.replace(locMatch[0], ' ');
    }
  }

  // Clean up residual: strip filler words ("with", "that have", "and") + extra whitespace
  const cleaned = residual
    .replace(/\b(?:with|that\s+have|and|companies|company)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { filters: result, residual: cleaned };
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
