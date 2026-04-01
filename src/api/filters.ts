import apiClient from './client';

export interface CompanyNameOption {
  name: string;
  fqdn?: string;
  company_lid?: number;
  logo_url?: string;
  domains_homepage?: string;
  industry_primary_group?: string;
}

export interface LocationOption {
  key?: string; // 'country' | 'state' | 'city' | 'continent' | 'country_grouping'
  name?: string;
  country?: string;
  state?: string;
  city?: string;
  continent?: string;
  country_grouping?: string;
  country_code?: string;
  code?: string;
}

export interface IndustryLabelOption {
  value: string;
  id?: number;
  mainIndustry?: string;
  mainIndustryId?: number;
  subIndustriesCount?: number;
}

async function fetchFilterOptions<T>(filterName: string, text: string, extraParams?: Record<string, any>): Promise<T[]> {
  if (!text.trim()) return [];
  try {
    const res = await apiClient.get(`/v2/filters/${filterName}`, {
      params: { text: text.trim(), ...extraParams },
    });
    const data = res.data;
    return data?.[filterName] ?? (Array.isArray(data) ? data : []);
  } catch (e: any) {
    console.log('[filters] error', filterName, e?.response?.status, JSON.stringify(e?.response?.data ?? e?.message ?? '').substring(0, 150));
    return [];
  }
}

export const fetchCompanyNames = (text: string): Promise<CompanyNameOption[]> =>
  fetchFilterOptions<CompanyNameOption>('companyName', text);

export const fetchContactLocations = (text: string): Promise<LocationOption[]> =>
  fetchFilterOptions<LocationOption>('contactLocation', text);

export const fetchCompanyLocations = (text: string): Promise<LocationOption[]> =>
  fetchFilterOptions<LocationOption>('companyLocation', text);

export async function fetchIndustryLabels(text: string): Promise<IndustryLabelOption[]> {
  if (!text.trim()) return [];
  try {
    const res = await apiClient.get('/v2/filters/companyIndustryLabels', {
      params: { text: text.trim() },
    });
    const data = res.data;
    // API returns grouped structure: [{ main_industry, main_industry_id, sub_industries: [{value, id}, ...] }]
    const groups: any[] = data?.companyIndustryLabels ?? (Array.isArray(data) ? data : []);
    const q = text.trim().toLowerCase();
    const flat: IndustryLabelOption[] = [];
    for (const group of groups) {
      const mainIndustry: string = group.main_industry ?? group.mainIndustry ?? '';
      const mainIndustryId: number | undefined = group.main_industry_id ?? group.mainIndustryId;
      const subs: any[] = group.sub_industries ?? group.subIndustries ?? [];
      const mainMatches = mainIndustry.toLowerCase().includes(q);
      for (const sub of subs) {
        if (!sub.value) continue;
        // Include if the sub-industry value or main industry matches the query
        if (mainMatches || sub.value.toLowerCase().includes(q)) {
          flat.push({ value: sub.value, id: sub.id, mainIndustry, mainIndustryId, subIndustriesCount: subs.length });
        }
      }
    }
    return flat.slice(0, 12);
  } catch (e: any) {
    console.log('[filters] error companyIndustryLabels', e?.response?.status, JSON.stringify(e?.response?.data ?? e?.message ?? '').substring(0, 150));
    return [];
  }
}

export function getLocationLabel(loc: LocationOption): string {
  function tc(s?: string): string {
    if (!s) return '';
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (loc.key === 'country') return tc(loc.country) || loc.name || '';
  if (loc.key === 'state') return `${tc(loc.state)}, ${tc(loc.country)}`;
  if (loc.key === 'city') {
    const parts = [tc(loc.city), loc.state ? tc(loc.state) : undefined, tc(loc.country)].filter(Boolean);
    return parts.join(', ');
  }
  if (loc.key === 'continent') return tc(loc.continent) || '';
  if (loc.key === 'country_grouping') return (loc.country_grouping ?? '').toUpperCase();
  return loc.name || tc(loc.country) || '';
}
