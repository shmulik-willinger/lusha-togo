/**
 * Lusha Signals Relay — Cloudflare Worker
 *
 * KV namespace (bound as DEVICE_TOKENS):
 *   key = lusha userId  →  value = ExponentPushToken[xxx]
 *
 * Endpoints:
 *   POST /register                      — mobile app registers userId → push token
 *   GET  /signal?userId=&challenge=     — Lusha webhook challenge verification
 *   POST /signal?userId=                — Lusha delivers a signal event
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function extractEntityName(payload) {
  const d = payload.data ?? {};
  const entityType = payload.entityType ?? payload.entity_type ?? 'contact';
  if (entityType === 'company') {
    return (
      payload.entityName ??
      d.companyName ??
      d.name ??
      'A company'
    );
  }
  return (
    d.contactName ??
    d.name ??
    d.fullName ??
    d.full_name ??
    (d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : null) ??
    d.firstName ??
    payload.entityName ??
    'A contact'
  );
}

// Short humanised label per signal type. Mirrors the `signalLabel`
// function in the mobile app so push-notification titles match what the
// user sees inside Activity.
function labelForSignal(type) {
  const map = {
    companyChange: 'Changed jobs',
    promotion: 'Promoted',
    surgeInHiring: 'Surge in hiring',
    surgeInHiringByDepartment: 'Surge in hiring by dept',
    surgeInHiringByLocation: 'Surge in hiring by location',
    headcountIncrease1m: 'Headcount ↑ (1m)',
    headcountIncrease3m: 'Headcount ↑ (3m)',
    headcountIncrease6m: 'Headcount ↑ (6m)',
    headcountIncrease12m: 'Headcount ↑ (12m)',
    headcountDecrease1m: 'Headcount ↓ (1m)',
    headcountDecrease3m: 'Headcount ↓ (3m)',
    headcountDecrease6m: 'Headcount ↓ (6m)',
    headcountDecrease12m: 'Headcount ↓ (12m)',
    websiteTrafficIncrease: 'Website traffic ↑',
    websiteTrafficDecrease: 'Website traffic ↓',
    itSpendIncrease: 'IT spend ↑',
    itSpendDecrease: 'IT spend ↓',
    riskNews: 'Risk news',
    commercialActivityNews: 'Commercial activity',
    corporateStrategyNews: 'Corporate strategy',
    financialEventsNews: 'Financial events',
    peopleNews: 'People news',
    marketIntelligenceNews: 'Market intelligence',
    productActivityNews: 'Product activity',
    funding: 'Funding round',
    techAdoption: 'Tech adoption',
  };
  return map[type] || type;
}

// Context sentence for each signal type — appears as notification body.
function detailForSignal(type, d) {
  switch (type) {
    case 'companyChange': {
      const arrow = d.previousCompanyName && d.currentCompanyName
        ? `${d.previousCompanyName} → ${d.currentCompanyName}` : d.currentCompanyName;
      return [arrow, d.currentTitle].filter(Boolean).join(' · ');
    }
    case 'promotion':
      return [
        d.currentTitle ? `Now: ${d.currentTitle}` : null,
        d.currentSeniorityLabel ? `(${d.currentSeniorityLabel})` : null,
      ].filter(Boolean).join(' ');
    case 'surgeInHiring':
    case 'surgeInHiringByDepartment':
    case 'surgeInHiringByLocation': {
      const parts = [];
      if (d.newJobsCount != null) parts.push(`${d.newJobsCount} new jobs`);
      if (d.departmentLabel) parts.push(d.departmentLabel);
      if (d.locationLabel) parts.push(d.locationLabel);
      return parts.join(' · ');
    }
    case 'headcountIncrease1m':
    case 'headcountIncrease3m':
    case 'headcountIncrease6m':
    case 'headcountIncrease12m':
    case 'headcountDecrease1m':
    case 'headcountDecrease3m':
    case 'headcountDecrease6m':
    case 'headcountDecrease12m': {
      const pct = d.percentChange;
      const cur = d.currentHeadcount;
      const dir = type.includes('Increase') ? '+' : '';
      if (pct != null && cur != null) return `${dir}${pct}% · now ${cur.toLocaleString()} employees`;
      if (pct != null) return `${dir}${pct}%`;
      return '';
    }
    case 'websiteTrafficIncrease':
    case 'websiteTrafficDecrease':
      return d.percentChange != null ? `${type.includes('Increase') ? '+' : ''}${d.percentChange}% vs historical avg` : '';
    case 'itSpendIncrease':
    case 'itSpendDecrease':
      return d.percentChange != null ? `${type.includes('Increase') ? '+' : ''}${d.percentChange}% spend change` : '';
    default:
      return d.headline || d.title || d.summary || '';
  }
}

function buildNotification(token, payload) {
  const signalType = payload.signal_type ?? payload.signalType ?? 'unknown';
  const entityType = payload.entityType ?? payload.entity_type ?? 'contact';
  const d = payload.data ?? {};
  const name = extractEntityName(payload);
  const label = labelForSignal(signalType);

  // For contact signals (companyChange / promotion) the title is
  // person-centric. For company signals, lead with the company.
  let title;
  let body;
  if (signalType === 'companyChange') {
    title = `${name} changed jobs`;
    body = detailForSignal(signalType, d);
  } else if (signalType === 'promotion') {
    title = `${name} was promoted`;
    body = detailForSignal(signalType, d);
  } else {
    title = `${name} · ${label}`;
    body = detailForSignal(signalType, d) || name;
  }

  return {
    to: token,
    sound: 'default',
    title,
    body: body || title,
    data: {
      signal_type: signalType,
      signal_data: { ...d, contactName: name, signalDate: d.signalDate ?? d.date },
      entity_id: String(payload.entityId ?? payload.entity_id ?? d.entityId ?? ''),
      entity_type: entityType,
      entity_name: name,
    },
    priority: 'high',
    badge: 1,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /register ──────────────────────────────────────────────────────
    if (request.method === 'POST' && pathname === '/register') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const { userId, token } = body ?? {};
      if (!userId || !token) return json({ error: 'userId and token required' }, 400);

      await env.DEVICE_TOKENS.put(String(userId), String(token));
      return json({ ok: true });
    }

    // ── GET /signal — Lusha challenge verification ───────────────────────────
    // Lusha sends GET with ?challenge=xxx — must echo it back immediately
    if (request.method === 'GET' && pathname === '/signal') {
      const challenge = searchParams.get('challenge');
      if (challenge) return json({ challenge });
      return json({ status: 'ok' });
    }

    // ── GET /debug/token?userId= — inspect the token stored in KV ────────────
    // Returns the first + last few chars so we can verify it without leaking.
    if (request.method === 'GET' && pathname === '/debug/token') {
      const userId = searchParams.get('userId');
      if (!userId) return json({ error: 'userId query param required' }, 400);
      const token = await env.DEVICE_TOKENS.get(userId);
      if (!token) return json({ userId, hasToken: false }, 200);
      const preview = token.length > 30
        ? `${token.slice(0, 22)}…${token.slice(-6)}`
        : token;
      return json({ userId, hasToken: true, tokenPreview: preview, tokenLength: token.length }, 200);
    }

    // ── GET /debug/list — list all keys in KV ────────────────────────────────
    if (request.method === 'GET' && pathname === '/debug/list') {
      const { keys } = await env.DEVICE_TOKENS.list();
      const rows = await Promise.all(keys.map(async (k) => {
        const v = await env.DEVICE_TOKENS.get(k.name);
        const preview = v && v.length > 30 ? `${v.slice(0, 22)}…${v.slice(-6)}` : v;
        return { key: k.name, tokenPreview: preview, tokenLength: v?.length ?? 0 };
      }));
      return json({ count: rows.length, keys: rows }, 200);
    }

    // ── DELETE /debug/token?userId= — clear the stale mapping ────────────────
    if (request.method === 'DELETE' && pathname === '/debug/token') {
      const userId = searchParams.get('userId');
      if (!userId) return json({ error: 'userId query param required' }, 400);
      await env.DEVICE_TOKENS.delete(userId);
      return json({ userId, deleted: true }, 200);
    }

    // ── POST /signal?userId= — receive signal from Lusha ────────────────────
    if (request.method === 'POST' && pathname === '/signal') {
      const userId = searchParams.get('userId');
      if (!userId) return json({ error: 'userId query param required' }, 400);
      // `?debug=1` causes us to await the Expo response and include it in the
      // reply, instead of the usual fire-and-forget. Used for manual tests.
      const debug = searchParams.get('debug') === '1';

      // IMPORTANT: Must respond 201 immediately or Lusha will retry / cancel subscription
      let payload;
      try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const token = await env.DEVICE_TOKENS.get(userId);

      if (token && !debug) {
        const notification = buildNotification(token, payload);
        ctx.waitUntil(
          fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify([notification]),
          }),
        );
        return json({ ok: true, pushed: true }, 201);
      }

      if (token && debug) {
        const notification = buildNotification(token, payload);
        let expoStatus;
        let expoBody;
        try {
          const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify([notification]),
          });
          expoStatus = res.status;
          expoBody = await res.text();
        } catch (e) {
          expoStatus = 'fetch-failed';
          expoBody = String(e?.message ?? e);
        }
        return json({
          ok: true,
          pushed: true,
          tokenPreview: token.length > 30 ? `${token.slice(0, 22)}…${token.slice(-6)}` : token,
          notification,
          expo: { status: expoStatus, body: expoBody },
        }, 201);
      }

      // Always return 201 to Lusha — even if no token yet
      return json({ ok: true, pushed: false }, 201);
    }

    return json({ error: 'Not found' }, 404);
  },
};
