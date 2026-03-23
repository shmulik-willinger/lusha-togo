import apiClient from './client';
import { SearchContact } from './search';

export interface RecommendedLead extends SearchContact {
  recommendationScore?: number;
}

export interface RecommendationsResponse {
  leads: RecommendedLead[];
  total?: number;
  recommendationsListId?: string;
  maskId?: string;
}

// Map from lusha-lists-client ContactSchema format to our SearchContact format
function mapContact(raw: any, maskId?: string, listId?: string): RecommendedLead {
  const companyId = raw.companyDetails?.companyId?.toString() ?? raw.companyDetails?.id?.toString() ?? raw.companyId?.toString();
  const phones = (raw.datapoints?.phones ?? []).map((p: any) => ({
    number: p.value ?? '',
    type: p.type,
    is_do_not_call: p.doNotCall ?? false,
    datapointId: p.datapointId,
    isMasked: p.isMasked ?? true,
  }));
  const emails = (raw.datapoints?.emails ?? []).map((e: any) => ({
    address: e.value ?? '',
    type: e.type,
    datapointId: e.datapointId,
    isMasked: e.isMasked ?? true,
  }));
  return {
    id: raw.id ?? '',
    contactId: raw.id ?? '',
    name: {
      first: raw.firstName ?? '',
      last: raw.lastName ?? '',
      full: raw.fullName ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
    },
    job_title: {
      title: raw.job?.title ?? raw.job?.editedTitle ?? '',
      seniority: raw.job?.seniority,
      department: raw.job?.departments?.[0],
    },
    location: {
      country: raw.location?.country,
      state: raw.location?.state,
      city: raw.location?.city,
    },
    phones,
    emails,
    social_link: raw.socialLinks?.linkedin ?? raw.socialLinks?.linkedIn,
    isShown: raw.type === 'SHOWN',
    isContactFullDNC: raw.isFullDNC ?? false,
    company: raw.companyDetails
      ? { name: raw.companyDetails.name ?? '', id: companyId }
      : undefined,
    personId: raw.personId,
    companyId,
    maskId,
    listId,
  };
}

export interface RecommendationGroup {
  id: string;
  name: string;
  leads: RecommendedLead[];
  total: number;
  maskId?: string;
}

export interface RecommendationsResponse {
  leads: RecommendedLead[];
  groups: RecommendationGroup[];
  total?: number;
  recommendationsListId?: string;
  maskId?: string;
}

export async function getRecommendedLeads(): Promise<RecommendationsResponse> {
  const { data } = await apiClient.post<any>('/api/v1/contacts/recommendations');

  console.log('[recommendations] top-level keys:', Object.keys(data ?? {}).join(','));
  console.log('[recommendations] raw:', JSON.stringify(data).substring(0, 800));

  // Check if the response has multiple recommendation groups
  const rawGroups: any[] = data?.recommendations ?? data?.groups ?? data?.lists ?? [];

  if (rawGroups.length > 0) {
    // Multiple groups — each group has its own contacts
    const groups: RecommendationGroup[] = rawGroups.map((g: any) => {
      const gMaskId: string | undefined = g.maskId ?? data?.maskId;
      const gListId: string | undefined = (g.id ?? g.listId ?? g.recommendationsListId)?.toString();
      const rawContacts: any[] = g.contacts ?? g.leads ?? g.results ?? [];
      const leads = rawContacts.map((raw) => mapContact(raw, gMaskId, gListId));
      return {
        id: gListId ?? '',
        name: g.name ?? g.title ?? 'Recommended Leads',
        leads,
        total: g.total ?? g.pagination?.rowCount ?? leads.length,
        maskId: gMaskId,
      };
    });
    const allLeads = groups.flatMap((g) => g.leads);
    return {
      leads: allLeads,
      groups,
      total: allLeads.length,
      recommendationsListId: groups[0]?.id,
      maskId: data?.maskId,
    };
  }

  // Single flat list of contacts
  const rawContacts: any[] =
    data?.contacts ?? data?.leads ?? data?.results ?? (Array.isArray(data) ? data : []);

  const maskId: string | undefined = data?.maskId;
  const recommendationsListId: string | undefined = data?.recommendationsListId;
  console.log('[recommendations] maskId:', maskId, 'listId:', recommendationsListId, 'contacts:', rawContacts.length);

  const leads = rawContacts.map((raw) => mapContact(raw, maskId, recommendationsListId));
  return {
    leads,
    groups: leads.length > 0
      ? [{ id: recommendationsListId ?? 'recs', name: 'Recommended Leads', leads, total: leads.length, maskId }]
      : [],
    total: data?.pagination?.rowCount ?? data?.total ?? leads.length,
    recommendationsListId,
    maskId,
  };
}
