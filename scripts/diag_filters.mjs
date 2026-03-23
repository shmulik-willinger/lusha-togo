import axios from 'axios';

const COOKIE = process.argv[2];
const csrfMatch = COOKIE.match(/(?:^|;\s*)_csrf=([^;]+)/);
const xsrfMatch = COOKIE.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

const client = axios.create({
  baseURL: 'https://dashboard-services.lusha.com',
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json', Accept: 'application/json',
    Origin: 'https://dashboard.lusha.com', Referer: 'https://dashboard.lusha.com/',
    Cookie: COOKIE,
    ...(csrfMatch ? { _csrf: decodeURIComponent(csrfMatch[1]) } : {}),
    ...(xsrfMatch ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfMatch[1]) } : {}),
  },
});

async function test(label, filters, tab = 'contacts') {
  try {
    const { data } = await client.post('/v2/prospecting-full', {
      filters, display: tab, sessionId: crypto.randomUUID(),
      pages: { page: 1, pageSize: 5 }, searchTrigger: 'NewTab',
      savedSearchId: 0, isRecent: false, isSaved: false, fetchIntentTopics: false,
    });
    const n = tab === 'companies'
      ? (data?.companies?.companies_results_total ?? data?.companies?.results?.length ?? 0)
      : (data?.contacts?.contacts_results_total ?? data?.contacts?.results?.length ?? 0);
    console.log(`${n > 0 ? '✅' : '❌'} [${tab}] ${label} → ${n}`);
  } catch (e) {
    console.log(`❌ [${tab}] ${label} → ${e.response?.status}: ${JSON.stringify(e.response?.data).substring(0, 150)}`);
  }
}

console.log('\n🔬 Diagnosing remaining filters...\n');

// companySize - try different formats
await test('companySize [{min:100}]',         { companySize: [{ min: 100 }] }, 'companies');
await test('companySize [{min:1,max:50000}]',  { companySize: [{ min: 1, max: 50000 }] }, 'companies');

// companyName
await test('companyName Salesforce contacts', { companyName: [{ name: 'Salesforce' }] }, 'contacts');
await test('companyName Salesforce companies',{ companyName: [{ name: 'Salesforce' }] }, 'companies');
await test('companyName IBM companies',       { companyName: [{ name: 'IBM' }] }, 'companies');

// department
await test('dept Engineering', { contactDepartment: [{ value: 'Engineering', label: 'Engineering' }] });
await test('dept Sales',       { contactDepartment: [{ value: 'Sales', label: 'Sales' }] });

// industry values
await test('industry Technology',         { companyIndustryLabels: [{ value: 'Technology' }] }, 'companies');
await test('industry Internet',           { companyIndustryLabels: [{ value: 'Internet' }] }, 'companies');
await test('industry Computer Software',  { companyIndustryLabels: [{ value: 'Computer Software' }] }, 'companies');

console.log('\nDone.\n');
