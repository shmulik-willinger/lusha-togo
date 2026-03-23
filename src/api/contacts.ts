import apiClient from './client';
import { SearchContact } from './search';
import { revealWebViewManager } from '../utils/revealWebView';

// Reveal a contact using the unmask endpoint (the correct production endpoint).
// Requires the full SearchContact object so we can build the correct payload:
//   - maskId: top-level field from the list contacts API response (stored on the contact)
//   - uniqueId: "${personId}-${companyId}" — identifies this contact instance in the list
//   - datapointId: per phone/email data point ID for what to unmask
export async function revealContact(contact: SearchContact): Promise<any> {
  const contactId = contact.contactId ?? contact.id;
  const maskId = contact.maskId ?? contactId;
  const listId = contact.listId;

  const uniqueId = contact.personId && contact.companyId
    ? `${contact.personId}-${contact.companyId}`
    : contact.id ?? contactId;

  const emailDataPointIds = (contact.emails ?? [])
    .filter((e) => e.isMasked !== false && e.datapointId)
    .map((e) => e.datapointId!);

  const phoneDataPointIds = (contact.phones ?? [])
    .filter((p) => p.isMasked !== false && p.datapointId)
    .map((p) => p.datapointId!);

  const product = listId ? 'lists' : 'prospecting';
  const contactEntry: any = {
    uniqueId,
    contact_id: contactId,
    email_data_points_ids: emailDataPointIds,
    phone_data_points_ids: phoneDataPointIds,
  };
  if (contact.contactInputId) contactEntry.contact_input_id = contact.contactInputId;

  const payload: any = {
    maskId,
    product,
    subPlatform: product,
    requestId: Math.random().toString(36).substring(2),
    contacts: [contactEntry],
  };
  if (listId) payload.listId = listId;

  console.log('[reveal] product:', product, 'contactId:', contactId, 'maskId:', maskId, 'uniqueId:', uniqueId);
  console.log('[reveal] personId:', contact.personId, 'companyId:', contact.companyId, 'listId:', listId);

  // For search contacts (no listId): always try the background WebView search+reveal
  // because direct API calls bypass PerimeterX, so the maskId is never cached in Redis.
  if (!contact.listId && contact.name) {
    console.log('[reveal] search contact — using WebView search+reveal for', contact.name.full);
    try {
      const wvResult = await revealWebViewManager.searchAndReveal({
        firstName: contact.name.first,
        lastName: contact.name.last,
        companyName: contact.company?.name,
        uniqueId,
        contactId,
        emailDataPointIds,
        phoneDataPointIds,
        contactInputId: contact.contactInputId,
      });
      console.log('[reveal] WebView success:', JSON.stringify(wvResult).substring(0, 200));
      return wvResult;
    } catch (wvErr: any) {
      console.log('[reveal] WebView approach failed:', wvErr?.message);
    }
  }

  try {
    const response = await apiClient.post<any>('/v1/api/shown-contacts/unmask', payload);
    console.log('[reveal] response:', JSON.stringify(response.data).substring(0, 300));
    return response.data;
  } catch (firstErr: any) {
    const errBody = JSON.stringify(firstErr?.response?.data ?? '');
    console.log('[reveal] unmask failed:', firstErr?.response?.status, errBody.substring(0, 200));
    throw firstErr;
  }
}

export async function getContactById(contactId: string): Promise<SearchContact> {
  try {
    const { data } = await apiClient.get<any>(`/api/v2/contacts/${contactId}`);
    return data;
  } catch {
    const { data } = await apiClient.get<SearchContact>(`/api/v1/contacts/${contactId}`);
    return data;
  }
}
