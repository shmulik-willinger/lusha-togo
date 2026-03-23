import apiClient from './client';
import { SearchContact, ContactPhone, ContactEmail, SearchCompany } from './search';

export interface ContactList {
  id: string;
  name: string;
  contactCount: number;
  updatedAt: string;
  createdAt: string;
  type: 'contacts' | 'companies';
}

export interface ContactListDetail extends ContactList {
  contacts: SearchContact[];
  companies?: SearchCompany[];
}

const ALL_CONTACTS_ID = 'all-contact';

function mapList(l: any): ContactList {
  return {
    id: (l.id ?? l._id ?? l.listId)?.toString() ?? '',
    name: l.name ?? l.listName ?? '',
    contactCount: l.total ?? l.contactCount ?? l.contacts_count ?? l.count ?? 0,
    updatedAt: l.updatedAt ?? l.updated_at ?? new Date().toISOString(),
    createdAt: l.createdAt ?? l.created_at ?? new Date().toISOString(),
    type: ['companies', 'company'].includes((l.type ?? l.listType ?? 'contacts').toLowerCase()) ? 'companies' : 'contacts',
  };
}

// Maps a contact from the Lists API format (lusha-lists-client ContactSchema)
// to our unified SearchContact format used by ContactCard.
function mapListContact(raw: any, maskId?: string, listId?: string): SearchContact {
  const firstName = raw.firstName ?? raw.name?.first ?? '';
  const lastName = raw.lastName ?? raw.name?.last ?? '';
  const fullName = raw.fullName ?? raw.name?.full ?? `${firstName} ${lastName}`.trim();

  const jobTitle = raw.job?.title ?? raw.job?.editedTitle ?? raw.job_title?.title ?? '';
  const seniority = raw.job?.seniority ?? raw.job_title?.seniority;
  const department = raw.job?.departments?.[0] ?? raw.job_title?.department;

  // Phones: lists API has { value, type, doNotCall, datapointId, isMasked, ... }
  const phones: ContactPhone[] = (raw.datapoints?.phones ?? raw.phones ?? []).map((p: any) => ({
    number: p.value ?? p.number ?? '',
    type: p.type,
    is_do_not_call: p.doNotCall ?? p.is_do_not_call ?? false,
    datapointId: p.datapointId,
    isMasked: p.isMasked ?? true,
  }));

  // Emails: lists API has { value, type, datapointId, isMasked, ... }
  const emails: ContactEmail[] = (raw.datapoints?.emails ?? raw.emails ?? []).map((e: any) => ({
    address: e.value ?? e.address ?? '',
    type: e.type,
    datapointId: e.datapointId,
    isMasked: e.isMasked ?? true,
  }));

  const companyId = raw.companyDetails?.companyId?.toString() ?? raw.companyDetails?.id?.toString();
  const company = raw.companyDetails
    ? { name: raw.companyDetails.name ?? '', id: companyId }
    : raw.company;

  return {
    id: raw.id?.toString() ?? '',
    contactId: raw.id?.toString() ?? '',
    name: { first: firstName, last: lastName, full: fullName },
    job_title: jobTitle ? { title: jobTitle, seniority, department } : undefined,
    location: raw.location,
    phones,
    emails,
    social_link: raw.socialLinks?.linkedin ?? raw.socialLinks?.linkedIn ?? raw.social_link,
    isShown: raw.type === 'SHOWN' ?? raw.isShown ?? false,
    isContactFullDNC: raw.isFullDNC ?? raw.isContactFullDNC ?? false,
    company,
    personId: raw.personId,
    companyId,
    maskId,
    listId,
    isBlockedForShow: raw.isBlockedForShow ?? false,
  };
}

function safeStr(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return safeStr(v.value ?? v.name ?? v.key ?? v.label);
  return undefined;
}

function mapListCompany(raw: any): SearchCompany {
  // The lusha-lists-client API returns these as direct string fields on the company object:
  // primaryIndustry, subIndustry, specialities (note: "specialities" not "specialties"), homepageUrl,
  // headquarter (not location), companySize (not company_size), revenueRange (not revenue_range)
  const rawPrimary =
    safeStr(raw.primaryIndustry) ??
    safeStr(raw.primary_industry) ??
    (() => {
      const industryRaw = (raw.industry && typeof raw.industry === 'object') ? raw.industry
        : (raw.industryDetails && typeof raw.industryDetails === 'object') ? raw.industryDetails
        : {};
      return safeStr(industryRaw.primary_industry) ?? safeStr(industryRaw.value) ?? safeStr(industryRaw.name) ??
        (typeof raw.industry === 'string' ? raw.industry : undefined);
    })();
  const primaryIndustry = rawPrimary && /^\d+(\.\d+)?$/.test(rawPrimary) ? undefined : rawPrimary;

  const rawSecondary = safeStr(raw.subIndustry) ?? safeStr(raw.sub_industry) ?? safeStr(raw.secondary_industry);
  const secondaryIndustry = rawSecondary && /^\d+(\.\d+)?$/.test(rawSecondary) ? undefined : rawSecondary;

  // headquarter from lists API: { city, country, state }
  const hq = raw.headquarter ?? raw.headquarters;
  const location = raw.location
    ?? (hq ? { city: hq.city, country: hq.country, state: hq.state } : undefined)
    ?? (raw.locationDetails ? { country: raw.locationDetails.country, city: raw.locationDetails.city } : undefined);

  // specialities (lusha-lists-client spelling) or specialties
  const specialtiesRaw = raw.specialities ?? raw.specialties ?? raw.specialties_list;
  const specialties: string[] | undefined = Array.isArray(specialtiesRaw)
    ? specialtiesRaw.map((s: any) => safeStr(s) ?? '').filter(Boolean)
    : typeof specialtiesRaw === 'string' && specialtiesRaw.trim()
    ? specialtiesRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  return {
    company_lid: raw.company_lid?.toString() ?? raw.companyId?.toString() ?? raw.id?.toString() ?? '',
    company_id: raw.company_id?.toString() ?? raw.lusha_company_id?.toString() ?? raw.companyId?.toString() ?? raw.id?.toString() ?? '',
    name: safeStr(raw.name) ?? safeStr(raw.company_name) ?? '',
    logo_url: safeStr(raw.logoUrl ?? raw.logo_url),
    homepage_url: safeStr(raw.homepageUrl ?? raw.homepage_url ?? raw.website ?? raw.fqdn ?? raw.domains?.homepage),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    company_size: raw.companySize ?? raw.company_size,
    location,
    industry: primaryIndustry ? { primary_industry: primaryIndustry } : undefined,
    secondary_industry: secondaryIndustry,
    specialties: specialties?.length ? specialties : undefined,
    sic: safeStr(raw.sic_code ?? raw.sic),
    naics: safeStr(raw.naics_code ?? raw.naics),
    revenue_range: raw.revenueRange ?? raw.revenue_range,
    social: (() => {
      const s = raw.social ?? {};
      const linkedin = s.linkedin ?? s.linkedin_url ?? raw.linkedin_url ?? raw.socialLinks?.linkedin ?? raw.socialLinks?.linkedIn ?? undefined;
      const twitter = s.twitter ?? s.twitter_url ?? undefined;
      const facebook = s.facebook ?? undefined;
      const crunchbase = s.crunchbase ?? undefined;
      return (linkedin || twitter || facebook || crunchbase)
        ? { linkedin, twitter, facebook, crunchbase }
        : undefined;
    })(),
    founded: safeStr(raw.founded ?? raw.founded_year),
    linkedin_followers: typeof raw.linkedin_followers === 'number' ? raw.linkedin_followers : undefined,
  };
}

export async function getContactLists(): Promise<ContactList[]> {
  const { data, status } = await apiClient.get<any>('/api/v1/lists', {
    params: { page: 0, pageSize: 100, order: 'desc', orderBy: 'createdAt' },
  });
  console.log('[lists] HTTP', status, 'type:', typeof data);

  if (typeof data === 'string' && data.trimStart().startsWith('<')) {
    throw new Error('Session expired — please sign in again');
  }

  const raw: any[] = data?.lists ?? data?.data ?? data?.items ?? (Array.isArray(data) ? data : []);
  console.log('[lists] parsed', raw.length, 'lists');

  // Filter out system virtual lists ("All Contacts", "All contacts", "All companies")
  const filtered = raw.filter((l: any) => {
    const name = (l.name ?? l.listName ?? '').toLowerCase();
    return !name.startsWith('all contact') && !name.startsWith('all compan');
  });

  return filtered.map(mapList);
}

export async function getContactListById(listId: string, page: number = 0, hintType?: 'contacts' | 'companies'): Promise<ContactListDetail> {
  const isAllContacts = listId === ALL_CONTACTS_ID;

  if (isAllContacts) {
    // For "All Contacts": overview metadata + contacts from v2 (v1 is not available in production)
    const [overviewRes, contactsRes] = await Promise.all([
      apiClient.get<any>('/api/v1/contacts/overview').catch(() => ({ data: null })),
      apiClient.get<any>('/api/v2/contacts', { params: { page, pageSize: 50 } }).catch(() =>
        apiClient.get<any>('/api/v1/contacts', { params: { page, pageSize: 50 } }).catch(() => ({ data: null }))
      ),
    ]);

    const overview = overviewRes.data;
    const contactsData = contactsRes.data;
    const rawContacts: any[] = contactsData?.contacts ?? [];
    const maskId: string | undefined = contactsData?.maskId;

    console.log('[list-all] overview:', JSON.stringify(overview)?.substring(0, 200));
    console.log('[list-all] contacts count:', rawContacts.length, 'maskId:', maskId);

    return {
      id: ALL_CONTACTS_ID,
      name: 'All Contacts',
      contactCount: overview?.total ?? rawContacts.length,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: 'contacts',
      contacts: rawContacts.map((raw) => mapListContact(raw, maskId, ALL_CONTACTS_ID)),
    };
  }

  // For a specific list: metadata from /api/v1/lists/contacts/{id}, contacts from /api/v2/contacts/{id}
  // Using v2 endpoint (dashboard-facade → snapshots v2) which is the current production path.
  // v1 endpoint returns 404 because snapshots data is stored in v2 format.
  // For company lists, also try /api/v2/companies/{id} in parallel.
  const hintIsCompany = hintType === 'companies';
  const [metaRes, contactsRes, companiesHintRes] = await Promise.all([
    // For company lists, try /api/v1/lists/companies/{id}; for contacts, try /api/v1/lists/contacts/{id}
    (hintIsCompany
      ? apiClient.get<any>(`/api/v1/lists/companies/${listId}`).catch(() => apiClient.get<any>(`/api/v1/lists/contacts/${listId}`).catch(() => ({ data: null })))
      : apiClient.get<any>(`/api/v1/lists/contacts/${listId}`).catch(() => ({ data: null }))
    ),
    apiClient.get<any>(`/api/v2/contacts/${listId}`, { params: { page, pageSize: 50 } })
      .catch(async (err) => {
        // v2 failed — try v1 as fallback
        console.log('[list-detail] v2 failed, trying v1. Error:', err?.response?.status, JSON.stringify(err?.response?.data)?.substring(0, 100));
        return apiClient.get<any>(`/api/v1/contacts/${listId}`, { params: { page, pageSize: 50 } }).catch(() => ({ data: null }));
      }),
    // Company-list: use /api/v1/companies/{id} (the real lusha-lists-client endpoint)
    // Response: { companies: [...], pagination: { rowCount, pageCount, page, pageSize } }
    hintIsCompany
      ? apiClient.get<any>(`/api/v1/companies/${listId}`, { params: { page, pageSize: 50 } }).catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
  ]);

  const meta = metaRes.data ?? {};
  const contactsData = contactsRes.data;
  const companiesHintData = companiesHintRes.data;
  console.log('[list-detail] raw contactsData keys:', JSON.stringify(Object.keys(contactsData ?? {})));
  console.log('[list-detail] raw contactsData sample:', JSON.stringify(contactsData)?.substring(0, 500));
  if (hintIsCompany) console.log('[list-detail] companiesHintData sample:', JSON.stringify(companiesHintData)?.substring(0, 500));
  const maskId: string | undefined = contactsData?.maskId;

  // Detect list type: prefer meta.type, then check dedicated companies key, then inspect item shape
  const metaType = ((meta.type ?? meta.listType ?? 'contacts') as string).toLowerCase();
  const metaSaysCompany = ['companies', 'company'].includes(metaType);

  // All items returned by the contacts API (may be under various keys)
  const rawAllItems: any[] = contactsData?.contacts ?? contactsData?.data ?? contactsData?.results ?? (Array.isArray(contactsData) ? contactsData : []);

  // Items from the dedicated companies endpoint (only fetched when hintIsCompany)
  // /api/v1/companies/{id} returns { companies: [...], pagination: { rowCount, ... } }
  const rawCompaniesHint: any[] = companiesHintData?.companies ?? companiesHintData?.data ?? companiesHintData?.results ?? (Array.isArray(companiesHintData) ? companiesHintData : []);
  if (hintIsCompany) console.log('[list-detail] /api/v1/companies response keys:', JSON.stringify(Object.keys(companiesHintData ?? {})), 'count:', rawCompaniesHint.length);

  // If API returned a dedicated 'companies' array in the contacts response, use it directly
  const dedicatedCompanies: any[] = Array.isArray(contactsData?.companies) && contactsData.companies.length > 0
    ? contactsData.companies : [];

  // Shape-based fallback: if meta didn't say company but first item looks like a company
  // (has company_lid / lusha_company_id and no personId / firstName), treat as company list
  const firstItem = rawAllItems[0];
  const looksLikeCompany = !metaSaysCompany && firstItem && (
    firstItem.company_lid != null ||
    firstItem.lusha_company_id != null ||
    (firstItem.personId == null && firstItem.firstName == null && firstItem.name?.first == null)
  );

  const isCompanyList = hintIsCompany || metaSaysCompany || dedicatedCompanies.length > 0 || rawCompaniesHint.length > 0 || looksLikeCompany;
  console.log('[list-detail] listId:', listId, 'hintIsCompany:', hintIsCompany, 'metaType:', metaType, 'metaSaysCompany:', metaSaysCompany, 'looksLikeCompany:', looksLikeCompany, 'companiesHint:', rawCompaniesHint.length, 'isCompanyList:', isCompanyList);
  console.log('[list-detail] meta:', JSON.stringify(meta)?.substring(0, 150));

  const rawContacts: any[] = isCompanyList ? [] : rawAllItems;
  // Priority: dedicated companies hint endpoint → dedicated companies key in contacts response → all items
  const rawCompanies: any[] = isCompanyList
    ? (rawCompaniesHint.length > 0 ? rawCompaniesHint : dedicatedCompanies.length > 0 ? dedicatedCompanies : rawAllItems)
    : [];

  console.log('[list-detail] contacts raw count:', rawContacts.length, 'companies raw count:', rawCompanies.length, 'maskId:', maskId);
  if (rawContacts[0]) console.log('[list-detail] first contact raw:', JSON.stringify(rawContacts[0]).substring(0, 600));
  if (rawCompanies[0]) console.log('[list-detail] first company raw:', JSON.stringify(rawCompanies[0]).substring(0, 400));
  const blockedCount = rawContacts.filter((c: any) => c.isBlockedForShow).length;
  console.log('[list-detail] isBlockedForShow counts:', blockedCount, '/', rawContacts.length);

  const baseMeta = mapList(meta);
  // Override type if our shape-detection found companies (meta might be wrong/empty)
  if (isCompanyList) baseMeta.type = 'companies';

  return {
    ...baseMeta,
    contacts: rawContacts.map((raw) => mapListContact(raw, maskId, listId)),
    companies: rawCompanies.map(mapListCompany),
  };
}
