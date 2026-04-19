import apiClient from './client';

/**
 * Cloudflare Worker relay URL — routes Lusha webhooks to the right device via Expo Push.
 */
export const RELAY_BASE_URL = 'https://lusha-signals-relay.shmulik83.workers.dev';

export interface LushaSubscriptionResponse {
  id: string;
  entityType: string;
  entityId: string;
  signalTypes: string[];
  url: string;
  name?: string;
  isActive?: boolean;
  createdAt?: string;
}

/**
 * Create a Lusha webhook subscription for a contact or company.
 * Uses dashboard-services (cookie auth) — no external API key required.
 */
async function lushaExtFetch(apiKey: string, method: string, path: string, body?: object): Promise<any> {
  const url = `${LUSHA_EXT_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'api_key': apiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log('[signals] ext', method, path, '→', res.status, text.substring(0, 300));
  if (!res.ok) {
    const err: any = new Error(`Lusha API ${res.status}`);
    try { err.response = { status: res.status, data: JSON.parse(text) }; } catch {}
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

export async function createSubscription(params: {
  entityId: string;
  entityType: 'contact' | 'company';
  entityName: string;
  apiKey: string;
  userId: string;
}): Promise<LushaSubscriptionResponse> {
  const { entityId, entityType, entityName, apiKey, userId } = params;
  const webhookUrl = `${RELAY_BASE_URL}/signal?userId=${encodeURIComponent(userId)}`;
  // Signal types differ by entity type
  const signalTypes = entityType === 'company'
    ? ['headcountIncrease1m', 'headcountDecrease1m', 'surgeInHiring', 'riskNews', 'corporateStrategyNews']
    : ['companyChange', 'promotion'];
  // Lusha API format: shared config in "defaults", individual items in "subscriptions"
  const body = {
    defaults: {
      entityType,
      signalTypes,
      url: webhookUrl,
    },
    subscriptions: [{
      entityId,
      name: `${entityName} — Lusha ToGo`,
    }],
  };
  const response = await lushaExtFetch(apiKey, 'POST', '/api/subscriptions', body);
  // Response: { total, successful, failed, results: [{ index, success, subscription }] }
  const result = response?.results?.[0];
  if (result && !result.success) {
    const errMsg = result.error?.message ?? result.error ?? 'Subscription creation failed';
    const err: any = new Error(String(errMsg));
    err.response = { status: 400, data: { message: String(errMsg) } };
    throw err;
  }
  const sub = result?.subscription ?? response?.data?.[0] ?? response;
  return sub as LushaSubscriptionResponse;
}

/** Fetch all active subscriptions for the authenticated user. */
export async function listSubscriptions(apiKey: string): Promise<LushaSubscriptionResponse[]> {
  const data = await lushaExtFetch(apiKey, 'GET', '/api/subscriptions');
  // Response: { data: [...], pagination: {...} } — filter to active only
  const all: any[] = data?.data ?? data?.subscriptions ?? (Array.isArray(data) ? data : []);
  return all.filter((s: any) => s.isActive !== false);
}

/** Fetch ALL subscriptions (including inactive) — used for re-activation. */
export async function listAllSubscriptions(apiKey: string): Promise<LushaSubscriptionResponse[]> {
  const data = await lushaExtFetch(apiKey, 'GET', '/api/subscriptions');
  const all: any[] = data?.data ?? data?.subscriptions ?? (Array.isArray(data) ? data : []);
  return all;
}

/** Reactivate an existing (inactive) subscription by ID. */
export async function reactivateSubscription(id: string, apiKey: string): Promise<void> {
  await lushaExtFetch(apiKey, 'PATCH', `/api/subscriptions/${id}`, { isActive: true });
}

/** Deactivate (cancel) a subscription by ID. */
export async function deleteSubscription(id: string, apiKey: string): Promise<void> {
  await lushaExtFetch(apiKey, 'PATCH', `/api/subscriptions/${id}`, { isActive: false });
}

export interface LushaSignalEvent {
  signalType: string;
  signalDate?: string;
  data: Record<string, any>;
}

function pickDate(obj: any, depth = 0): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  // Direct date fields
  const d = obj.signalDate ?? obj.signal_date ?? obj.date ?? obj.publishedAt ??
    obj.eventDate ?? obj.publicationDate ?? obj.reportedAt ?? obj.createdAt ??
    obj.created_at ?? obj.updatedAt ?? obj.articleDate ?? obj.latestDate ??
    obj.latestSignalDate ?? obj.lastSignalDate ?? obj.publishDate;
  if (d) return String(d);
  // Search one level into common sub-objects/arrays
  if (depth < 1) {
    for (const key of ['articles', 'items', 'news', 'content', 'data', 'details']) {
      const sub = obj[key];
      if (Array.isArray(sub) && sub.length > 0) {
        const found = pickDate(sub[0], depth + 1);
        if (found) return found;
      } else if (sub && typeof sub === 'object') {
        const found = pickDate(sub, depth + 1);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function mapSignalEvents(raw: any[]): LushaSignalEvent[] {
  return raw.map((s: any) => {
    const data = s.data ?? s.details ?? s;
    return {
      signalType: s.signalType ?? s.signal_type ?? s.type ?? 'unknown',
      signalDate: pickDate(s) ?? pickDate(data),
      data,
    };
  });
}

function deduplicateAndSort(signals: LushaSignalEvent[]): LushaSignalEvent[] {
  // Keep only the most recent signal per type, then sort newest first
  const latestByType = new Map<string, LushaSignalEvent>();
  for (const s of signals) {
    const existing = latestByType.get(s.signalType);
    const existingTime = existing?.signalDate ? new Date(existing.signalDate).getTime() : 0;
    const newTime = s.signalDate ? new Date(s.signalDate).getTime() : 0;
    if (!existing || newTime > existingTime) {
      latestByType.set(s.signalType, s);
    }
  }
  return Array.from(latestByType.values()).sort((a, b) => {
    const tA = a.signalDate ? new Date(a.signalDate).getTime() : 0;
    const tB = b.signalDate ? new Date(b.signalDate).getTime() : 0;
    return tB - tA;
  });
}

/**
 * Extract signals from the Lusha API response.
 * Contacts: { contacts: { "<id>": { companyChange: {...}, promotion: {...} } } }  — values are objects
 * Companies: { companies: { "<id>": { surgeInHiring: [...], websiteTrafficDecrease: [...] } } } — values are arrays
 */
function extractSignals(responseData: any, entityId?: string): any[] {
  // New format: dictionary keyed by entityId
  const entityDict = responseData?.contacts ?? responseData?.companies;
  if (entityDict && typeof entityDict === 'object' && !Array.isArray(entityDict)) {
    const entityData = entityId ? entityDict[entityId] : Object.values(entityDict)[0];
    if (entityData && typeof entityData === 'object') {
      // Check for explicit signals array
      if (Array.isArray(entityData.signals)) return entityData.signals;
      // Dynamically extract all signal type keys
      const signals: any[] = [];
      for (const [type, value] of Object.entries(entityData)) {
        if (Array.isArray(value)) {
          // Company signals: array of events per signal type
          for (const item of value as any[]) {
            signals.push({ signalType: type, signalDate: pickDate(item as any), data: item });
          }
        } else if (value && typeof value === 'object') {
          // Contact signals: single event object per signal type
          const d = value as any;
          signals.push({ signalType: type, signalDate: pickDate(d), data: d });
        }
      }
      return signals;
    }
    return [];
  }
  // Legacy / fallback formats
  if (Array.isArray(responseData)) return responseData;
  const contacts: any[] = responseData?.contacts ?? responseData?.companies ?? [];
  if (Array.isArray(contacts) && contacts.length > 0) {
    return contacts.flatMap((c: any) => c.signals ?? c.companyChange ?? []);
  }
  return responseData?.signals ?? responseData?.data ?? [];
}

const LUSHA_EXT_BASE = 'https://api.lusha.com';

async function lushaFetch(apiKey: string, path: string, body: object): Promise<any> {
  const url = `${LUSHA_EXT_BASE}${path}`;
  console.log('[signals] fetch', url, JSON.stringify(body));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'api_key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('[signals] fetch status:', res.status, 'body:', text.substring(0, 600));
  if (!res.ok) {
    const err: any = new Error(`Lusha API ${res.status}`);
    try { err.response = { status: res.status, data: JSON.parse(text) }; } catch {}
    throw err;
  }
  return JSON.parse(text);
}

/**
 * Fetch current signals for a contact.
 * Endpoint: POST https://api.lusha.com/api/signals/contacts
 */
export async function getContactSignals(personId: string, apiKey: string): Promise<LushaSignalEvent[]> {
  try {
    const data = await lushaFetch(apiKey, '/api/signals/contacts', {
      contactIds: [Number(personId)],
      signals: ['allSignals'],
    });
    return deduplicateAndSort(mapSignalEvents(extractSignals(data, personId)));
  } catch (e: any) {
    console.log('[signals-err] contact:', e?.response?.status, e?.message);
    throw e;
  }
}

/**
 * Fetch current signals for a company.
 * Endpoint: POST https://api.lusha.com/api/signals/companies
 */
export async function getCompanySignals(companyId: string, apiKey: string): Promise<LushaSignalEvent[]> {
  try {
    const data = await lushaFetch(apiKey, '/api/signals/companies', {
      companyIds: [Number(companyId)],
      signals: ['allSignals'],
    });
    return deduplicateAndSort(mapSignalEvents(extractSignals(data, companyId)));
  } catch (e: any) {
    console.log('[signals-err] company:', e?.response?.status, e?.message);
    throw e;
  }
}

/**
 * Register this device's Expo push token with the relay.
 */
export async function registerDeviceWithRelay(userId: string, token: string): Promise<void> {
  const res = await fetch(`${RELAY_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Relay registration failed: ${res.status} ${text}`);
  }
}
