# Lusha ToGo — Connections & Tokens

## Cloudflare Worker (Signals Relay)

| Field | Value |
|-------|-------|
| Worker URL | https://lusha-signals-relay.shmulik83.workers.dev |
| Worker Name | lusha-signals-relay |
| Subdomain | shmulik83.workers.dev |
| Current Version ID | 8512ee75-c2dd-4144-8185-cd0844201979 |

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/register` | POST | Mobile app registers `userId → ExpoToken` |
| `/signal?userId=<id>` | GET | Lusha webhook challenge verification |
| `/signal?userId=<id>` | POST | Receive signal from Lusha, forward to Expo Push |

---

## Cloudflare KV Namespace

| Field | Value |
|-------|-------|
| Namespace Name | Lusha ToGo |
| Namespace ID | 66bdf1831b384c29b806f03db1a58ad2 |
| Binding name (in Worker) | DEVICE_TOKENS |
| Schema | `userId (string) → ExponentPushToken[xxx]` |

---

## Relay Config Files

| File | Purpose |
|------|---------|
| `relay/worker.js` | Worker source code |
| `relay/wrangler.toml` | Deploy config (KV binding + namespace ID) |

### Re-deploy command
```bash
cd relay
npx wrangler deploy
```

---

## App Config

| Field | Value |
|-------|-------|
| RELAY_BASE_URL (in app) | `src/api/signals.ts` → `RELAY_BASE_URL` |
| Webhook URL pattern | `https://lusha-signals-relay.shmulik83.workers.dev/signal?userId=<userId>` |

---

## Next Steps

1. **Expo Project ID** — required for push notifications on physical device:
   ```bash
   npx eas init
   ```
   Adds `extra.eas.projectId` to `app.json` automatically.
   Then remove `projectId: undefined` from `app/_layout.tsx` line ~58.

2. **Lusha API Key** — set in the app:
   Account tab → Signals section → "Set up Signals" → paste API key from Lusha dashboard.
