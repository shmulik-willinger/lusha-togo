import * as SecureStore from 'expo-secure-store';
import CookieManager from '@react-native-cookies/cookies';
import { BASE_URL } from './client';

export interface PhoneContactForUpload {
  fullName: string;
  company: string;
  email?: string;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// CSV columns must match what we declare in the mapping below.
function generateCSV(contacts: PhoneContactForUpload[]): string {
  const header = 'Full Name,Company Name,Email\n';
  const rows = contacts
    .map((c) =>
      [
        escapeCSV(c.fullName),
        escapeCSV(c.company),
        escapeCSV(c.email ?? ''),
      ].join(','),
    )
    .join('\n');
  return header + rows;
}

// UUID v4 generator (no native dependency needed)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  let cookie = '';
  let pxCookie = '';

  try {
    const raw = await SecureStore.getItemAsync('lusha_session');
    if (raw) {
      const session = JSON.parse(raw) as { cookie: string; pxCookie?: string };
      cookie = session.cookie ?? '';
      pxCookie = session.pxCookie ?? '';
    }
  } catch {}

  if (!cookie) {
    try {
      await CookieManager.flush().catch(() => {});
      const cookies = await CookieManager.get(BASE_URL);
      cookie = Object.values(cookies)
        .filter((c) => c.name && c.value)
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch {}
  }

  const headers: Record<string, string> = {
    Origin: 'https://dashboard.lusha.com',
    Referer: 'https://dashboard.lusha.com/',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  };

  if (cookie) {
    headers['Cookie'] = cookie;
    const csrfMatch = cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
    const xsrfMatch = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (csrfMatch) headers['_csrf'] = decodeURIComponent(csrfMatch[1]);
    if (xsrfMatch) headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
  }
  if (pxCookie) headers['x-px-cookies'] = pxCookie;

  return headers;
}

// ── Step 1a: Register the upload with a UUID key ───────────────────────────
// The browser sends: POST /v2/csv-enrichment-uploader
//   Content-Type: application/json
//   Body: { key: "<UUID>", fileName: "contacts.csv" }
// Response contains an upload URL (or S3 presigned URL) for the actual file.
async function registerUpload(
  key: string,
  fileName: string,
  authHeaders: Record<string, string>,
): Promise<string> {
  const url = `${BASE_URL}/v2/csv-enrichment-uploader`;
  console.log('[csvUpload] step1a → POST', url, 'key:', key);

  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, fileName }),
  });

  const responseText = await response.text().catch(() => '');
  console.log('[csvUpload] step1a status:', response.status, 'body:', responseText);

  if (!response.ok) {
    throw new Error(`Register upload failed (${response.status}): ${responseText.substring(0, 200)}`);
  }

  // The server returns a bare JSON string (the S3 presigned URL directly).
  // Handle both: plain string response and object with a url field.
  let uploadUrl: string | undefined;
  try {
    const json = JSON.parse(responseText);
    if (typeof json === 'string') {
      // Response IS the URL (bare quoted string)
      uploadUrl = json;
    } else {
      uploadUrl =
        json.url ??
        json.uploadUrl ??
        json.upload_url ??
        json.presignedUrl ??
        json.presigned_url ??
        json.signedUrl ??
        json.putUrl ??
        json.data?.url ??
        json.data?.uploadUrl;
    }
    console.log('[csvUpload] step1a uploadUrl:', uploadUrl?.substring(0, 80));
  } catch {
    // Maybe the response is a raw URL string (no quotes)
    if (responseText.startsWith('http')) {
      uploadUrl = responseText.trim();
    }
    console.log('[csvUpload] step1a non-JSON response:', responseText.substring(0, 100));
  }

  if (!uploadUrl) {
    throw new Error(`No upload URL in response: ${responseText.substring(0, 200)}`);
  }

  return uploadUrl;
}

// ── Step 1b: Upload the actual CSV to the presigned URL ────────────────────
async function uploadFileToUrl(uploadUrl: string, csvContent: string): Promise<void> {
  console.log('[csvUpload] step1b → PUT/POST', uploadUrl.substring(0, 80) + '...');

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/csv' },
    body: csvContent,
  });

  const responseText = await response.text().catch(() => '');
  console.log('[csvUpload] step1b status:', response.status, 'body:', responseText.substring(0, 200));

  if (!response.ok && response.status !== 200) {
    throw new Error(`File upload failed (${response.status}): ${responseText.substring(0, 150)}`);
  }
}

// ── Step 2: validate with column mapping ─────────────────────────────────────
async function validateMapping(
  key: string,
  authHeaders: Record<string, string>,
): Promise<void> {
  const url = `${BASE_URL}/v2/csv-enrichment-validation`;
  console.log('[csvUpload] step2 → POST', url, 'key:', key);

  const body = JSON.stringify({ fileId: key });

  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body,
  });

  const text = await response.text().catch(() => '');
  console.log('[csvUpload] step2 status:', response.status, 'body:', text.substring(0, 300));

  if (!response.ok) {
    throw new Error(`Validation failed (${response.status}): ${text.substring(0, 150)}`);
  }
}

// ── Step 3: publish / trigger enrichment ─────────────────────────────────────
async function publishEnrichment(
  key: string,
  authHeaders: Record<string, string>,
): Promise<void> {
  const url = `${BASE_URL}/v2/csv-enrichment-publisher`;
  console.log('[csvUpload] step3 → POST', url, 'key:', key);

  const body = JSON.stringify({
    fileId: key,
    requestId: key,
    headers: 'Full Name, Company Name, Email',
    withHeaders: true,
    existingDataPoints: 'phones_and_emails',
    creditType: 'phones_and_emails',
    mappings: {
      'Full name': 0,
      'Company name': 1,
      'Email': 2,
    },
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body,
  });

  const text = await response.text().catch(() => '');
  console.log('[csvUpload] step3 status:', response.status, 'body:', text.substring(0, 300));

  if (!response.ok) {
    throw new Error(`Publish failed (${response.status}): ${text.substring(0, 150)}`);
  }
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function uploadContactsCSV(contacts: PhoneContactForUpload[]): Promise<void> {
  if (contacts.length === 0) throw new Error('No contacts selected');

  const csv = generateCSV(contacts);
  const authHeaders = await buildAuthHeaders();
  const key = generateUUID();
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timePart = now.toTimeString().slice(0, 5).replace(':', '-'); // HH-MM
  const fileName = `mobile ${datePart} ${timePart}.csv`;

  console.log('[csvUpload] uploading', contacts.length, 'contacts, key:', key);

  const uploadUrl = await registerUpload(key, fileName, authHeaders);
  await uploadFileToUrl(uploadUrl, csv);
  await validateMapping(key, authHeaders);
  await publishEnrichment(key, authHeaders);
  console.log('[csvUpload] ✅ all steps completed, key:', key);
}
