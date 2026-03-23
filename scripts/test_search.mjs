/**
 * Integration test: verifies that various filter types return results
 * for both contacts and companies.
 *
 * Usage:  node scripts/test_search.mjs <cookie_string>
 * The cookie string is captured from logcat: [api-cookie-dump] ...
 */

import axios from 'axios';

const COOKIE = process.argv[2];
if (!COOKIE) {
  console.error('Usage: node scripts/test_search.mjs "<cookie_string>"');
  process.exit(1);
}

const BASE_URL = 'https://dashboard-services.lusha.com';

const csrfMatch = COOKIE.match(/(?:^|;\s*)_csrf=([^;]+)/);
const xsrfMatch = COOKIE.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: 'https://dashboard.lusha.com',
    Referer: 'https://dashboard.lusha.com/',
    Cookie: COOKIE,
    ...(csrfMatch ? { _csrf: decodeURIComponent(csrfMatch[1]) } : {}),
    ...(xsrfMatch ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfMatch[1]) } : {}),
  },
});

// ─── Filter builder (mirrors src/api/search.ts buildApiFilters) ───────────────
function buildFilters(f) {
  const api = {};
  if (f.contactJobTitle?.length) api.contactJobTitle = f.contactJobTitle.map(t => ({ title: t }));
  if (f.contactSeniority?.length) api.contactSeniority = f.contactSeniority;
  if (f.contactDepartment?.length) api.contactDepartment = f.contactDepartment.map(d => ({ value: d, label: d }));
  if (f.contactLocation?.length) api.contactLocation = f.contactLocation.map(l => ({ name: l, country: l }));
  if (f.contactName?.length) api.contactName = f.contactName;
  if (f.companyName?.length) api.companyName = f.companyName.map(n => ({ name: n }));
  if (f.companyIndustryLabels?.length) api.companyIndustryLabels = f.companyIndustryLabels.map(i => ({ value: i }));
  if (f.companyLocation?.length) api.companyLocation = f.companyLocation.map(l => ({ name: l, country: l }));
  if (f.companySize) api.companySize = [f.companySize];
  if (f.companyRevenue) api.companyRevenue = [f.companyRevenue];
  if (f.companyFoundedYear) api.companyFoundedYear = f.companyFoundedYear;
  return api;
}

async function search(label, tab, filters) {
  const effectiveFilters = tab === 'companies'
    ? {
        companyName: filters.companyName,
        companySize: filters.companySize,
        companyRevenue: filters.companyRevenue,
        companyIndustryLabels: filters.companyIndustryLabels,
        companyLocation: filters.companyLocation,
        companyFoundedYear: filters.companyFoundedYear,
      }
    : filters;

  const payload = {
    filters: buildFilters(effectiveFilters),
    display: tab,
    sessionId: crypto.randomUUID(),
    pages: { page: 1, pageSize: 10 },
    searchTrigger: 'NewTab',
    savedSearchId: 0,
    isRecent: false,
    isSaved: false,
    fetchIntentTopics: false,
  };

  try {
    const { data } = await client.post('/v2/prospecting-full', payload);
    if (tab === 'contacts') {
      const count = data?.contacts?.contacts_results_total ?? data?.contacts?.results?.length ?? 0;
      const ok = count > 0;
      console.log(`${ok ? '✅' : '❌'} [${tab}] ${label} → ${count} results`);
    } else {
      const count = data?.companies?.companies_results_total ?? data?.companies?.results?.length ?? 0;
      const ok = count > 0;
      console.log(`${ok ? '✅' : '❌'} [${tab}] ${label} → ${count} results`);
    }
  } catch (e) {
    const msg = e.response?.data ? JSON.stringify(e.response.data).substring(0, 200) : e.message;
    console.log(`❌ [${tab}] ${label} → ERROR ${e.response?.status}: ${msg}`);
  }
}

// ─── Test cases ───────────────────────────────────────────────────────────────
console.log('\n🔍 Running search filter tests...\n');

await search('no filters',                'contacts', {});
await search('jobTitle: VP of Sales',     'contacts', { contactJobTitle: ['VP of Sales'] });
await search('seniority: Director',       'contacts', { contactSeniority: ['Director'] });
await search('department: Engineering',   'contacts', { contactDepartment: ['Engineering'] });
await search('location: United States',   'contacts', { contactLocation: ['United States'] });
await search('contactName: John',         'contacts', { contactName: ['John'] });
await search('companyName: Google',       'contacts', { companyName: ['Google'] });
await search('industry: Technology',      'contacts', { companyIndustryLabels: ['Technology'] });
await search('companySize 1000-5000',     'contacts', { companySize: { min: 1000, max: 5000 } });
await search('multi: title+location',     'contacts', { contactJobTitle: ['Sales Manager'], contactLocation: ['United States'] });

console.log('');

await search('no filters',               'companies', {});
await search('companyName: Microsoft',   'companies', { companyName: ['Microsoft'] });
await search('industry: Fintech',        'companies', { companyIndustryLabels: ['Financial Services'] });
await search('location: Israel',         'companies', { companyLocation: ['Israel'] });
await search('size 500-2000',            'companies', { companySize: { min: 500, max: 2000 } });
await search('revenue filter',           'companies', { companyRevenue: { min: 10000000 } });
await search('multi: industry+location', 'companies', { companyIndustryLabels: ['Technology'], companyLocation: ['United States'] });

console.log('\nDone.\n');
