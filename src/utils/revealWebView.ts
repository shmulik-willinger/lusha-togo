/**
 * Background WebView singleton for PX-authenticated reveals.
 *
 * The Android WebView runs PerimeterX on a real device (same as Chrome).
 * By injecting fetch() into the background WebView (loaded on dashboard.lusha.com),
 * PX intercepts the call and adds its sensor headers — so the backend caches search
 * results and the unmask endpoint succeeds.
 *
 * Flow for search contacts (no PX via direct API call):
 *   1. Search for the contact by name+company in the background WebView
 *      → gets a maskId (PX is present in WebView → Redis populated)
 *   2. Unmask using that maskId + original uniqueId/datapointIds
 *      → returns revealed phones/emails
 */

import type { RefObject } from 'react';
import * as SecureStore from 'expo-secure-store';
import CookieManager from '@react-native-cookies/cookies';

interface PendingRequest {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
}

export interface SearchAndRevealParams {
  firstName: string;
  lastName: string;
  companyName?: string;
  uniqueId: string;       // "personId-companyId" stable identifier
  contactId: string;      // UUID
  emailDataPointIds: string[];
  phoneDataPointIds: string[];
  contactInputId?: string;
}

class RevealWebViewManager {
  // Set from the BackgroundRevealWebView component via setRef()
  private _ref: { current: any } | null = null;
  private _pending = new Map<string, PendingRequest>();
  private _loadedResolve: (() => void) | null = null;
  private _loadedPromise: Promise<void>;
  private _loadDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this._loadedPromise = new Promise((r) => {
      this._loadedResolve = r;
    });
  }

  setRef(ref: RefObject<any>) {
    this._ref = ref;
  }

  /** Called by BackgroundRevealWebView onLoad */
  isLoaded(): boolean {
    return this._loadedResolve === null;
  }

  onLoaded() {
    // Debounce: the WebView fires multiple onLoad events during the redirect chain
    // (dashboard.lusha.com redirects 3-4 times before settling on the final page).
    // We wait 5s after the LAST onLoad so PX SDK has time to initialize on the final page.
    if (this._loadDebounceTimer) clearTimeout(this._loadDebounceTimer);
    this._loadDebounceTimer = setTimeout(() => {
      this._loadDebounceTimer = null;
      if (this._loadedResolve) {
        const resolve = this._loadedResolve;
        this._loadedResolve = null;
        resolve();
        console.log('[bg-webview] WebView settled on final page + PX ready for reveals');
      }
    }, 5000);
  }

  /** Called by BackgroundRevealWebView onMessage */
  handleMessage(rawData: string) {
    console.log('[bg-webview] message received:', rawData.substring(0, 500));
    try {
      const msg = JSON.parse(rawData);
      if (msg.type === 'reveal_diag') {
        console.log('[bg-webview] search-diag: HTTP', msg.status, '| keys:', msg.keys, '| maskId:', msg.maskId, '| requestId:', msg.requestId, '| contacts:', msg.contactCount);
        console.log('[bg-webview] search-body:', msg.bodyPreview);
        return;
      }
      if (msg.type !== 'reveal_result') return;
      const pending = this._pending.get(msg.reqId);
      if (!pending) return;
      this._pending.delete(msg.reqId);
      if (msg.error) {
        const label = msg.status ? `HTTP ${msg.status}: ` : '';
        pending.reject(new Error(`${label}${msg.error.substring(0, 300)}`));
      } else {
        try {
          pending.resolve(JSON.parse(msg.data));
        } catch {
          pending.reject(new Error('Failed to parse reveal response from WebView'));
        }
      }
    } catch { /* ignore non-JSON messages */ }
  }

  /**
   * Run a 2-step search+reveal inside the background WebView:
   *   1. POST /v2/prospecting-full (with name filter) → get maskId (PX sets it)
   *   2. POST /v1/api/shown-contacts/unmask with that maskId
   */
  async searchAndReveal(params: SearchAndRevealParams, timeoutMs = 30_000): Promise<any> {
    const wv = this._ref?.current;
    console.log('[bg-webview] searchAndReveal start, ref set:', !!this._ref, 'wv ready:', !!wv, 'loaded:', this.isLoaded());
    if (!wv) throw new Error('BackgroundRevealWebView not mounted');

    // Wait for the dashboard page to fully load (PX initialises after page load)
    await Promise.race([
      this._loadedPromise,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('Background WebView not ready (timed out)')), 15_000),
      ),
    ]);

    const reqId = Math.random().toString(36).substring(2);

    // Build the contact entry for the unmask payload
    const contactEntry: Record<string, any> = {
      uniqueId: params.uniqueId,
      contact_id: params.contactId,
      email_data_points_ids: params.emailDataPointIds,
      phone_data_points_ids: params.phoneDataPointIds,
    };
    if (params.contactInputId) contactEntry.contact_input_id = params.contactInputId;

    const fullName = `${params.firstName} ${params.lastName}`.trim();
    const searchFilters: Record<string, any> = {
      contactName: [fullName],
    };
    if (params.companyName) {
      searchFilters.companyName = [{ name: params.companyName }];
    }

    // Serialise to JS literals safely
    const contactEntryJson = JSON.stringify(JSON.stringify(contactEntry));
    const searchFiltersJson = JSON.stringify(JSON.stringify(searchFilters));

    const script = `
      (function() {
        const reqId = ${JSON.stringify(reqId)};
        const contactEntry = JSON.parse(${contactEntryJson});
        const searchFilters = JSON.parse(${searchFiltersJson});
        const BASE = 'https://dashboard-services.lusha.com';

        // Signal that script started executing (confirms injectJavaScript works)
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reveal_diag', reqId: reqId, status: 'script_started' }));

        // Extract CSRF tokens from WebView cookies (required by Lusha API for POST requests)
        var csrfHeaders = {};
        try {
          var docCookies = document.cookie || '';
          var csrfMatch = docCookies.match(/(?:^|;\\s*)_csrf=([^;]+)/);
          var xsrfMatch = docCookies.match(/(?:^|;\\s*)XSRF-TOKEN=([^;]+)/);
          if (csrfMatch) csrfHeaders['_csrf'] = decodeURIComponent(csrfMatch[1]);
          if (xsrfMatch) csrfHeaders['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reveal_diag', reqId: reqId, status: 'csrf_check', csrfKeys: Object.keys(csrfHeaders).join(','), cookieCount: docCookies.split(';').length }));
        } catch(e) {}

        // Step 1: Search for the contact (PX SDK intercepts fetch and adds sensor headers)
        // The sessionId we send becomes the Redis cache key (maskId) in lusha-prospecting:
        //   addSessionIdToParams.js: context.params.sessionId = context.data.sessionId
        //   maskContactsData.js: const maskId = sessionId → context.result.maskId = maskId
        // We capture it here so we can use it as maskId in step 2, even if the response
        // omits the maskId field (response has requestId instead).
        var searchSessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
        var abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var abortTimer = abortCtrl ? setTimeout(function() { abortCtrl.abort(); }, 20000) : null;
        fetch(BASE + '/v2/prospecting-full', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, csrfHeaders),
          body: JSON.stringify({
            filters: searchFilters,
            display: 'contacts',
            sessionId: searchSessionId,
            pages: { page: 1, pageSize: 25 },
            searchTrigger: 'NewTab',
            savedSearchId: 0,
            isRecent: false,
            isSaved: false,
            fetchIntentTopics: false,
          }),
          credentials: 'include',
          signal: abortCtrl ? abortCtrl.signal : undefined,
        })
        .then(function(r) {
          if (abortTimer) clearTimeout(abortTimer);
          var status = r.status;
          return r.text().then(function(text) {
            var data = null;
            try { data = JSON.parse(text); } catch(e) {}
            var topKeys = data ? Object.keys(data).join(',') : 'parse-failed';
            // Prefer data.maskId (if backend returns it), fall back to our searchSessionId
            // (which is what the backend stored as the Redis cache key)
            var maskId = (data && data.maskId) || searchSessionId;
            var contactCount = (data && data.contacts && data.contacts.results) ? data.contacts.results.length : -1;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'reveal_diag', reqId: reqId,
              status: status, keys: topKeys,
              maskId: data && data.maskId,
              requestId: data && data.requestId,
              contactCount: contactCount,
              bodyPreview: text.substring(0, 300),
            }));
            if (!r.ok) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'reveal_result', reqId,
                error: 'Search failed HTTP ' + status + ': ' + text.substring(0, 200),
              }));
              return null;
            }
            // Step 2: Unmask using the fresh maskId (from PX-protected search cache)
            var unmaskPayload = {
              maskId: maskId,
              product: 'prospecting',
              subPlatform: 'prospecting',
              requestId: Math.random().toString(36).substring(2),
              contacts: [contactEntry],
            };
            return fetch(BASE + '/v1/api/shown-contacts/unmask', {
              method: 'POST',
              headers: Object.assign({ 'Content-Type': 'application/json' }, csrfHeaders),
              body: JSON.stringify(unmaskPayload),
              credentials: 'include',
            }).then(function(r2) {
              return r2.text().then(function(text2) { return { ok: r2.ok, status: r2.status, text: text2 }; });
            });
          });
        })
        .then(function(result) {
          if (!result) return;
          window.ReactNativeWebView.postMessage(JSON.stringify(
            result.ok
              ? { type: 'reveal_result', reqId, data: result.text }
              : { type: 'reveal_result', reqId, error: result.text, status: result.status }
          ));
        })
        .catch(function(err) {
          if (abortTimer) clearTimeout(abortTimer);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'reveal_result', reqId, error: 'fetch-error: ' + err.message,
          }));
        });
      })();
      true;
    `;

    // Sync session cookies to the API domain so the WebView's fetch is authenticated.
    // The WebView is at dashboard.lusha.com, but the API lives at dashboard-services.lusha.com.
    // Without explicit cookie sync, cross-subdomain cookies may not be sent with the fetch.
    try {
      const raw = await SecureStore.getItemAsync('lusha_session');
      if (raw) {
        const session = JSON.parse(raw) as { cookie?: string };
        const pairs: Record<string, string> = {};
        (session.cookie ?? '').split(';').forEach((p: string) => {
          const eq = p.indexOf('=');
          if (eq > 0) pairs[p.substring(0, eq).trim()] = p.substring(eq + 1).trim();
        });
        await CookieManager.flush().catch(() => {});
        for (const [name, value] of Object.entries(pairs)) {
          await CookieManager.set('https://dashboard-services.lusha.com', {
            name, value,
            domain: 'dashboard-services.lusha.com',
            path: '/',
            version: '1',
          }).catch(() => {});
        }
        console.log('[bg-webview] synced', Object.keys(pairs).length, 'session cookies to API domain');
      }
    } catch (e) {
      console.log('[bg-webview] cookie sync failed:', e);
    }

    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(reqId);
        reject(new Error('Reveal via background WebView timed out'));
      }, timeoutMs);

      this._pending.set(reqId, {
        resolve: (data) => { clearTimeout(timer); resolve(data); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      });

      wv.injectJavaScript(script);
    });
  }
}

export const revealWebViewManager = new RevealWebViewManager();
