import apiClient from './client';

export interface SearchFilters {
  // Contact filters — exact field names as accepted by /v2/prospecting-full
  contactName?: string[];
  contactJobTitle?: string[];
  contactDepartment?: string[];
  contactSeniority?: string[];
  contactLocation?: string[];
  contactExistingDataPoints?: string[];
  // Company filters
  companyName?: string[];
  companySize?: { min?: number; max?: number };
  companyRevenue?: { min?: number; max?: number };
  companyIndustryLabels?: string[];
  companyLocation?: string[];
  companyFoundedYear?: { min?: number; max?: number };
}

export interface SearchParams {
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
  tab?: 'contacts' | 'companies';
  sessionId?: string;
  searchTrigger?: string;
  searchText?: string; // natural-language fallback sent as search_text when no structured filters apply
}

export interface ContactPhone {
  number: string;
  country_code?: string;
  type?: string;
  normalized_number?: string;
  is_do_not_call?: boolean;
  datapointId?: string;
  isMasked?: boolean;
}

export interface ContactEmail {
  address: string;
  label?: string;
  quality_score?: number;
  status?: string;
  datapointId?: string;
  isMasked?: boolean;
}

export interface SearchContact {
  id: string;
  contactId: string;
  name: { first: string; last: string; full: string };
  job_title?: { title: string; seniority?: string; department?: string };
  location?: { country?: string; state?: string; city?: string };
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  social_link?: string;
  isShown?: boolean;
  isContactFullDNC?: boolean;
  isBlockedForShow?: boolean;
  company?: { name: string; id?: string };
  previous_job?: { company?: string; job_title?: string };
  // Fields needed for reveal/unmask
  personId?: number;
  companyId?: string;
  maskId?: string;
  listId?: string;
  contactInputId?: string;
}

export interface SearchCompany {
  company_lid: string;
  company_id: string;
  name: string;
  logo_url?: string;
  homepage_url?: string;
  description?: string;
  company_size?: { min?: number; max?: number; employees_in_linkedin?: number };
  location?: { country?: string; city?: string; state?: string };
  industry?: { primary_industry?: string };
  secondary_industry?: string;
  specialties?: string[];
  sic?: string;
  naics?: string;
  revenue_range?: { min?: number; max?: number; string?: string };
  funding_summary?: {
    last_funding_round?: string;
    total_fund_events?: number;
    value_usd?: number;
    ipo_date?: string;
  };
  social?: { linkedin?: string; twitter?: string; facebook?: string; crunchbase?: string };
  founded?: string;
  linkedin_followers?: number;
  funding_rounds?: Array<{
    title: string;
    money_raised_usd?: number;
    announced_on?: string;
  }>;
}

export interface SearchResponse {
  contacts?: SearchContact[];
  companies?: SearchCompany[];
  total?: number;
  page?: number;
  hasMore?: boolean;
}

// Map a raw contact from /v2/prospecting-full to our SearchContact interface
// searchRequestId: the top-level requestId from the search API response (Redis cache key for unmask)
function mapSearchContact(raw: any, uniqueCompanies: Record<string, any> = {}, searchRequestId?: string): SearchContact {
  const companyLid = raw.metadata?.company_lid?.toString();
  const company = companyLid ? uniqueCompanies[companyLid] : undefined;

  const firstName = raw.name?.first ?? raw.firstName ?? '';
  const lastName = raw.name?.last ?? raw.lastName ?? '';
  const fullName = raw.name?.full ?? raw.fullName ?? `${firstName} ${lastName}`.trim();
  const jobTitle = raw.job_title?.title ?? raw.job?.title ?? '';
  const seniority = raw.job_title?.seniority ?? raw.job?.seniority;
  const department = raw.job_title?.department ?? raw.job?.departments?.[0];

  // Log raw contact structure once to identify datapointId field names
  if ((raw.phones?.length || raw.datapoints?.phones?.length) && (raw.phones?.[0] || raw.datapoints?.phones?.[0])) {
    const rawPhone = raw.phones?.[0] ?? raw.datapoints?.phones?.[0];
    console.log('[search-raw] phone keys:', JSON.stringify(Object.keys(rawPhone ?? {})));
    console.log('[search-raw] phone full:', JSON.stringify(rawPhone));
    console.log('[search-raw] contact top-level keys:', JSON.stringify(Object.keys(raw ?? {})));
    console.log('[search-raw] maskId:', raw.maskId, 'unique_search_id:', raw.unique_search_id, 'unique_id:', raw.unique_id, 'contactInputId:', raw.contactInputId);
  }
  const phones: ContactPhone[] = (raw.phones ?? raw.datapoints?.phones ?? []).map((p: any) => ({
    number: p.number ?? p.value ?? '',
    type: p.type,
    is_do_not_call: p.is_do_not_call ?? p.doNotCall ?? false,
    normalized_number: p.normalized_number ?? p.normalizedNumber,
    datapointId: p.datapointId ?? p.datapoint_id ?? p.id ?? p.pointId ?? p.phone_id,
    isMasked: p.isMasked ?? p.masked ?? true,
  }));

  const emails: ContactEmail[] = (raw.emails ?? raw.datapoints?.emails ?? []).map((e: any) => ({
    address: e.address ?? e.value ?? '',
    label: e.label ?? e.type,
    datapointId: e.datapointId ?? e.datapoint_id ?? e.id ?? e.pointId ?? e.email_id,
    isMasked: e.isMasked ?? e.masked ?? true,
  }));

  // raw.id = "personId-companyId" (e.g. "97964901-70955968")
  // raw.contactId = UUID (e.g. "7a520435-5403-5791-b225-68705aaecda0") — this is what the unmask API needs
  const contactUUID = raw.contactId?.toString() ?? raw.id?.toString() ?? '';

  return {
    id: raw.id?.toString() ?? '',
    contactId: contactUUID,
    name: { first: firstName, last: lastName, full: fullName },
    job_title: jobTitle ? { title: jobTitle, seniority, department } : undefined,
    location: raw.location,
    phones,
    emails,
    social_link: raw.social_link ?? raw.socialLinks?.linkedin,
    isShown: raw.isShown ?? raw.type === 'SHOWN',
    isContactFullDNC: raw.isContactFullDNC ?? raw.isFullDNC ?? false,
    company: company
      ? { name: company.name ?? '', id: companyLid }
      : raw.company ?? (raw.companyDetails ? { name: raw.companyDetails.name ?? '' } : undefined),
    // Fields needed for reveal
    // searchRequestId from the search response is the Redis cache key the unmask API uses as maskId
    personId: raw.dataContactId ?? raw.personId ?? raw.person_id ?? raw.metadata?.person_id,
    companyId: companyLid ?? raw.companyId?.toString(),
    maskId: searchRequestId ?? raw.unique_search_id?.toString() ?? raw.maskId?.toString() ?? contactUUID,
    contactInputId: raw.contactInputId,
  };
}

// Safely extract a string from a value that might be a string or an object with a value/key field
function safeStr(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return safeStr(v.value ?? v.name ?? v.key ?? v.label);
  return undefined;
}

function mapSearchCompany(raw: any): SearchCompany {
  console.log('[company-size] raw company_size:', JSON.stringify(raw.company_size ?? raw.companySize));
  console.log('[company-industry] raw industry:', JSON.stringify(raw.industry));
  // raw.industry may be a string ("Technology") or an object {primary_industry, value, key, ...}
  const industryRaw = (raw.industry && typeof raw.industry === 'object') ? raw.industry : {};
  const rawIndustryStr =
    safeStr(industryRaw.primary_industry) ??
    safeStr(industryRaw.value) ??
    safeStr(industryRaw.key) ??
    (typeof raw.industry === 'string' ? raw.industry : undefined);
  const primaryIndustryStr = rawIndustryStr && /^\d+(\.\d+)?$/.test(rawIndustryStr) ? undefined : rawIndustryStr;

  const locationRaw = raw.location ?? {};

  const rawSecondaryIndustry = safeStr(industryRaw.secondary_industry) ?? safeStr(industryRaw.secondary);
  const secondaryIndustryStr = rawSecondaryIndustry && /^\d+(\.\d+)?$/.test(rawSecondaryIndustry) ? undefined : rawSecondaryIndustry;

  const specialtiesRaw = raw.specialties ?? raw.specialties_list;
  const specialties: string[] | undefined = Array.isArray(specialtiesRaw)
    ? specialtiesRaw.map((s: any) => safeStr(s) ?? '').filter(Boolean)
    : typeof specialtiesRaw === 'string' && specialtiesRaw.trim()
    ? specialtiesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  return {
    company_lid: raw.company_lid?.toString() ?? raw.id?.toString() ?? '',
    company_id: raw.company_id?.toString() ?? raw.lusha_company_id?.toString() ?? raw.id?.toString() ?? '',
    name: safeStr(raw.name) ?? safeStr(raw.company_name) ?? '',
    logo_url: safeStr(raw.logo_url ?? raw.logoUrl),
    homepage_url: safeStr(raw.homepage_url ?? raw.website ?? raw.homepageUrl ?? raw.fqdn),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    company_size: raw.company_size ?? raw.companySize,
    location: {
      country: safeStr(locationRaw.country),
      city: safeStr(locationRaw.city),
      state: safeStr(locationRaw.state),
    },
    industry: primaryIndustryStr ? { primary_industry: primaryIndustryStr } : undefined,
    secondary_industry: secondaryIndustryStr,
    specialties: specialties?.length ? specialties : undefined,
    sic: safeStr(raw.sic_code ?? raw.sic),
    naics: safeStr(raw.naics_code ?? raw.naics),
    revenue_range: raw.revenue_range ?? raw.revenueRange,
    funding_summary: raw.funding_summary ?? raw.fundingSummary,
    social: (() => {
      const s = raw.social ?? {};
      const linkedin = s.linkedin ?? s.linkedin_url ?? raw.linkedin_url ?? undefined;
      const twitter = s.twitter ?? s.twitter_url ?? undefined;
      const facebook = s.facebook ?? undefined;
      const crunchbase = s.crunchbase ?? undefined;
      return (linkedin || twitter || facebook || crunchbase)
        ? { linkedin, twitter, facebook, crunchbase }
        : undefined;
    })(),
    founded: safeStr(raw.founded ?? raw.founded_year),
    linkedin_followers: typeof raw.linkedin_followers === 'number' ? raw.linkedin_followers : undefined,
    funding_rounds: raw.funding_rounds ?? raw.fundingRounds,
  };
}

/**
 * Convert our simple SearchFilters into the exact payload format /v2/prospecting-full expects.
 * The API receives the serialized `data` portion of each filter (not the UI wrapper object).
 * Derived from lusha-prospecting-app/src/Models/filters.js toSearchRequest().
 */
function buildApiFilters(f: SearchFilters): Record<string, any> {
  const api: Record<string, any> = {};
  // contactJobTitle → [{ title: string }]  (ContactJobTitleData)
  if (f.contactJobTitle?.length) {
    api.contactJobTitle = f.contactJobTitle.map((t) => ({ title: t }));
  }
  // contactSeniority → plain strings e.g. ["VP", "Director"]
  if (f.contactSeniority?.length) {
    api.contactSeniority = f.contactSeniority;
  }
  // contactDepartment → [{ value, label }]  (ValueLabelData)
  if (f.contactDepartment?.length) {
    api.contactDepartment = f.contactDepartment.map((d) => ({ value: d, label: d }));
  }
  // contactLocation → [{ name, country }]  (LocationData)
  if (f.contactLocation?.length) {
    api.contactLocation = f.contactLocation.map((l) => ({ name: l, country: l }));
  }
  // contactName → plain strings (API expects string[])
  if (f.contactName?.length) {
    api.contactName = f.contactName;
  }
  // companyName → [{ name }]  (CompanyNameData)
  if (f.companyName?.length) {
    api.companyName = f.companyName.map((n) => ({ name: n }));
  }
  // companyIndustryLabels → [{ value }]  (label not allowed)
  if (f.companyIndustryLabels?.length) {
    api.companyIndustryLabels = f.companyIndustryLabels.map((i) => ({ value: i }));
  }
  // companyLocation → [{ name, country }]
  if (f.companyLocation?.length) {
    api.companyLocation = f.companyLocation.map((l) => ({ name: l, country: l }));
  }
  // companySize/Revenue/FoundedYear → must be arrays
  if (f.companySize) api.companySize = [f.companySize];
  if (f.companyRevenue) api.companyRevenue = [f.companyRevenue];
  if (f.companyFoundedYear) api.companyFoundedYear = [f.companyFoundedYear];
  return api;
}

export async function searchProspects(params: SearchParams): Promise<SearchResponse> {
  const filtersInput = params.filters ?? {};
  // When searching companies, strip contact-only filters to avoid API validation errors
  const effectiveFilters: SearchFilters = params.tab === 'companies'
    ? {
        companyName: filtersInput.companyName,
        companySize: filtersInput.companySize,
        companyRevenue: filtersInput.companyRevenue,
        companyIndustryLabels: filtersInput.companyIndustryLabels,
        companyLocation: filtersInput.companyLocation,
        companyFoundedYear: filtersInput.companyFoundedYear,
      }
    : filtersInput;

  // sessionId is the Redis cache key on the server (maskId for unmask).
  // Must be captured here so we can pass it as maskId to each contact.
  const sessionId = params.sessionId ?? crypto.randomUUID();

  const apiFilters = buildApiFilters(effectiveFilters);
  const hasApiFilters = Object.keys(apiFilters).length > 0;

  const payload: Record<string, any> = {
    filters: apiFilters,
    display: params.tab ?? 'contacts',
    sessionId,
    pages: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    },
    searchTrigger: params.page && params.page > 1 ? 'NewPage' : 'NewTab',
    savedSearchId: 0,
    isRecent: false,
    isSaved: false,
    fetchIntentTopics: false,
  };

  // filters.searchText = free-text fallback for company search only
  // (for contacts, structured filters like contactJobTitle are sufficient)
  if (params.tab === 'companies' && params.searchText) {
    payload.filters.searchText = [params.searchText];
  }

  console.log('[search] payload:', JSON.stringify(payload).substring(0, 800));
  let data: any;
  try {
    const res = await apiClient.post<any>('/v2/prospecting-full', payload);
    data = res.data;
  } catch (err: any) {
    // 422 = "Empty prospecting query" — treat as no results rather than an error
    if (err?.response?.status === 422) {
      console.log('[search] 422 empty query — returning empty results');
      return { contacts: [], companies: [], total: 0, page: params.page ?? 1, hasMore: false };
    }
    throw err;
  }

  console.log('[search] raw keys:', Object.keys(data ?? {}).join(','), '| contacts keys:', Object.keys(data?.contacts ?? {}).join(','));
  // Web app uses results.maskId (NOT results.requestId) as the unmask cache key
  console.log('[search] top-level maskId:', data?.maskId, '| requestId:', data?.requestId, '| is_in_api_test:', data?.is_in_api_test);
  console.log('[search] raw:', JSON.stringify(data).substring(0, 600));
  console.log('[search] contacts.total:', data?.contacts?.total, '| contacts.results.length:', data?.contacts?.results?.length, '| companies.total:', data?.companies?.total);

  // sessionId is the Redis cache key (server comment: maskContactsData.js stores it as maskId).
  // data.maskId should equal sessionId when present; fall back to sessionId if missing.
  const searchRequestId: string | undefined = data?.maskId?.toString() ?? sessionId;

  // Response: { contacts: { results: [...], contacts_results_total, unique_companies }, ... }
  const contactsData = data?.contacts;
  const uniqueCompanies: Record<string, any> =
    contactsData?.unique_companies && !Array.isArray(contactsData.unique_companies)
      ? contactsData.unique_companies : {};
  const rawContacts: any[] = contactsData?.results ?? (Array.isArray(contactsData) ? contactsData : []);
  const contacts = rawContacts.map((c) => mapSearchContact(c, uniqueCompanies, searchRequestId));
  const totalContacts = contactsData?.contacts_results_total ?? contactsData?.total ?? contacts.length;

  const companiesData = data?.companies;
  const rawCompanies: any[] = companiesData?.results ?? (Array.isArray(companiesData) ? companiesData : []);
  const companies = rawCompanies.map(mapSearchCompany);
  console.log('[search] mapped companies:', companies.length);
  const total = params.tab === 'companies' ? (companiesData?.companies_results_total ?? companiesData?.total ?? rawCompanies.length) : totalContacts;
  const currentPage = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  console.log('[search] mapped contacts:', contacts.length, '| mapped companies:', rawCompanies.length, '| total:', total, '| hasMore:', currentPage * pageSize < total);
  return {
    contacts,
    companies,
    total,
    page: currentPage,
    hasMore: currentPage * pageSize < total,
  };
}
