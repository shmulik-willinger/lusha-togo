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

function buildNotification(token, payload) {
  const signalType = payload.signal_type ?? payload.signalType ?? 'unknown';
  const entityType = payload.entityType ?? payload.entity_type ?? 'contact';
  const d = payload.data ?? {};
  const name = extractEntityName(payload);

  let title = 'New Lusha Signal';
  let body = '';

  switch (signalType) {
    case 'companyChange':
      title = `${name} changed jobs`;
      body = [
        d.previousCompanyName && d.currentCompanyName
          ? `${d.previousCompanyName} → ${d.currentCompanyName}`
          : d.currentCompanyName,
        d.currentTitle,
      ].filter(Boolean).join(' · ');
      break;
    case 'promotion':
      title = `${name} was promoted`;
      body = [
        d.currentTitle ? `Now: ${d.currentTitle}` : null,
        d.currentSeniorityLabel ? `(${d.currentSeniorityLabel})` : null,
        !d.currentTitle && d.currentCompanyName ? `at ${d.currentCompanyName}` : null,
      ].filter(Boolean).join(' ');
      break;
    default:
      title = `Signal: ${signalType}`;
      body = d.currentCompanyName ?? d.currentTitle ?? name;
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

    // ── POST /signal?userId= — receive signal from Lusha ────────────────────
    if (request.method === 'POST' && pathname === '/signal') {
      const userId = searchParams.get('userId');
      if (!userId) return json({ error: 'userId query param required' }, 400);

      // IMPORTANT: Must respond 201 immediately or Lusha will retry / cancel subscription
      let payload;
      try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

      const token = await env.DEVICE_TOKENS.get(userId);

      if (token) {
        const notification = buildNotification(token, payload);
        ctx.waitUntil(
          fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify([notification]),
          }),
        );
      }

      // Always return 201 to Lusha — even if no token yet
      return json({ ok: true, pushed: !!token }, 201);
    }

    return json({ error: 'Not found' }, 404);
  },
};
