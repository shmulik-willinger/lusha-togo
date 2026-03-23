import axios from 'axios';
import { BASE_URL } from './client';
import apiClient from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SessionData {
  cookie: string;
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  plan?: string;
  creditsUsed?: number;
  creditsTotal?: number;
}

// Cookie names used by Lusha in production
const LUSHA_COOKIE_PATTERN = /^(ll|sall|ll_staging|sall_staging)=[^;]*/;

export async function login(payload: LoginPayload): Promise<SessionData> {
  // Use a plain axios call (no interceptors) so we can capture Set-Cookie headers
  const response = await axios.post(
    `${BASE_URL}/v2/login`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        '_csrf': 'mobile-app',
        'x-xsrf-token': 'mobile-app',
      },
      withCredentials: false,
      validateStatus: (status) => status < 500,
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(new Error('Invalid credentials'), { response });
  }

  if (response.status >= 400) {
    throw Object.assign(new Error('Login failed'), { response });
  }

  // Extract Set-Cookie header — axios on React Native exposes it as a string or array
  const setCookieHeader = response.headers['set-cookie'];
  let cookie = '';

  if (setCookieHeader) {
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const c of cookies) {
      const match = c.match(LUSHA_COOKIE_PATTERN);
      if (match) {
        cookie = match[0];
        break;
      }
    }
  }

  if (!cookie) {
    // Fallback: if we can't read the cookie header (some RN versions strip it),
    // try to use any cookie header value available
    const rawCookie = response.headers['set-cookie'];
    if (rawCookie) {
      const all = Array.isArray(rawCookie) ? rawCookie : [rawCookie];
      cookie = all[0]?.split(';')[0] ?? '';
    }
  }

  if (!cookie) {
    // On Android, OkHttp manages cookies internally and does not expose Set-Cookie
    // headers to JavaScript. The session cookie is still stored by the OS and will
    // be sent automatically on subsequent requests to the same domain.
    // We allow login to succeed here; the 401 interceptor will handle expiry.
    console.warn('[auth] Set-Cookie header not accessible — relying on system cookie management.');
  }

  // Extract user info from response body if available
  const body = response.data;
  const user = body?.user || body;

  return {
    cookie,
    userId: user?.id?.toString() || user?.userId?.toString(),
    email: user?.email || payload.email,
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
  };
}

export async function getUserInfo(userId?: string, email?: string): Promise<UserInfo> {
  let creditsUsed: number | undefined;
  let creditsTotal: number | undefined;
  let plan: string | undefined;

  const parseNum = (v: any): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  // Fire both requests in parallel: user info + credits wallet
  const [meResult, balResult] = await Promise.allSettled([
    apiClient.get<any>('/v2/users/me'),
    apiClient.get<any>('/api/v1/account-assets/balances/display'),
  ]);

  // --- User info ---
  let me: any = null;
  if (meResult.status === 'fulfilled') {
    me = meResult.value.data;
    const billingPlans: any[] = me?.accountBillingPlans ?? [];
    const activePlan = billingPlans.find((p: any) => p.status === 'active') ?? billingPlans[0];
    plan = activePlan?.billingPlan?.name ?? activePlan?.billingPlan?.planType ?? me?.plan ?? me?.planType;
    console.log('[getUserInfo] plan:', plan);
  } else {
    console.log('[getUserInfo] /v2/users/me failed:', (meResult.reason as any)?.response?.status);
  }

  // --- Credits wallet from /api/v1/account-assets/balances/display ---
  if (balResult.status === 'fulfilled') {
    const shared: any[] = balResult.value.data?.shared ?? [];
    console.log('[getUserInfo] balances/display shared:', JSON.stringify(shared).substring(0, 400));
    // Priority: user wallet > group wallet > credits wallet > bulk wallet
    const walletTypes = ['user', 'group', 'credits', 'bulk'];
    let wallet: any = null;
    for (const type of walletTypes) {
      wallet = shared.find((w: any) => w.source === type || w.type === type);
      if (wallet) break;
    }
    if (!wallet && shared.length > 0) wallet = shared[0];
    if (wallet) {
      creditsTotal = parseNum(wallet.total);
      creditsUsed = parseNum(wallet.totalUsed) ?? 0;
      console.log('[getUserInfo] wallet type:', wallet.type, wallet.source, '→ total:', creditsTotal, 'used:', creditsUsed);
    }
  } else {
    console.log('[getUserInfo] balances/display failed:', (balResult.reason as any)?.response?.status);
  }

  if (me) {
    return {
      userId: me?.id?.toString() ?? me?.userId?.toString() ?? userId ?? '',
      email: me?.email ?? email ?? '',
      firstName: me?.firstName ?? me?.first_name ?? '',
      lastName: me?.lastName ?? me?.last_name ?? '',
      plan,
      creditsUsed,
      creditsTotal,
    };
  }

  // Fallback: /api/v1/accounts/users list
  try {
    const { data } = await apiClient.get<any>('/api/v1/accounts/users');
    const users: any[] = data?.data ?? (Array.isArray(data) ? data : []);
    const isRealId = userId && userId !== 'anonymous';
    const user = users.find((u: any) =>
        (email && u.email === email) ||
        (isRealId && (u.id?.toString() === userId || u.uid === userId))
      ) ?? users[0];
    if (user) {
      return {
        userId: user.id?.toString() ?? userId ?? '',
        email: user.email ?? email ?? '',
        firstName: user.firstName ?? user.first_name ?? '',
        lastName: user.lastName ?? user.last_name ?? '',
        plan,
        creditsUsed,
        creditsTotal,
      };
    }
  } catch { /* ignore */ }

  // Last resort: return whatever we have from session
  return { userId: userId ?? '', email: email ?? '', firstName: '', lastName: '', plan, creditsUsed, creditsTotal };
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/v2/logout');
  } catch {
    // Ignore errors on logout
  }
}
