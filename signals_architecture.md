# Lusha Signals Mobile — ארכיטקטורה וחיבור הודעות לנייד

מסמך זה מסביר את המערכת המלאה שבנינו: מ-Webhook של Lusha ועד התראה push שמגיעה לטלפון.

---

## תמונה כללית של הארכיטקטורה

```
Lusha API
    │
    │  POST /webhooks/lusha
    ▼
ngrok (tunnel)
    │
    │  מעביר לשרת המקומי
    ▼
Node.js Server (Express)  ←── מאזין על port 3000
    │
    ├── שומר event ב-SQLite
    ├── מזהה את המשתמש
    ├── שולח ל-Expo Push API
    ▼
Expo Push API (https://exp.host/--/api/v2/push/send)
    │
    ▼
Mobile App (React Native / Expo)
    │
    └── מציג את ה-Signal על המסך
```

---

## שני הפרויקטים במערכת

| פרויקט | נתיב | תפקיד |
|--------|-------|--------|
| `webhooks` | `cursor-actions/webhooks/` | שרת Node.js — מקבל webhooks, שולח push |
| `lusha-signals-mobile` | `cursor-actions/lusha-signals-mobile/` | אפליקציית React Native — מציגה signals |

---

## שרת Node.js (`cursor-actions/webhooks/`)

### הפעלה
```bash
cd webhooks
npm start          # production
npm run dev        # development (watch mode)
```

### משתני סביבה (`.env`)
```env
PORT=3000
WEBHOOK_BASE_URL=https://<ngrok-url>   # כתובת הנגישה מבחוץ
LUSHA_API_KEY=<your-lusha-api-key>
LUSHA_API_URL=https://api.lusha.com
LUSHA_WEBHOOK_SECRET=<webhook-secret>  # אופציונלי, לאימות חתימה
TWILIO_ACCOUNT_SID=...                 # אופציונלי, ל-SMS/WhatsApp
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
DATABASE_PATH=./data/lusha-webhooks.db
```

---

## Endpoints של השרת

### 1. `GET /webhooks/lusha` — אימות Webhook
Lusha שולחת GET עם פרמטר `challenge` כדי לאמת את ה-endpoint. השרת צריך להחזיר את אותו challenge.

```json
// Request: GET /webhooks/lusha?challenge=abc123
// Response:
{ "challenge": "abc123" }
```

---

### 2. `POST /webhooks/lusha` — קבלת Webhook Event
זהו ה-endpoint העיקרי. Lusha שולחת לכאן כל signal event.

**Headers:**
```
X-Lusha-Signature: <HMAC SHA256>
X-Lusha-Timestamp: <unix timestamp>
```

**Body (דוגמה — companyChange):**
```json
{
  "id": "evt_xxx",
  "subscription_id": "sub_xxx",
  "signal_type": "companyChange",
  "data": {
    "currentCompanyName": "New Company",
    "currentTitle": "VP Engineering",
    "currentDomain": "newcompany.com",
    "previousCompanyName": "Old Company",
    "previousTitle": "Senior Engineer",
    "currentSeniorityLabel": "VP",
    "signalDate": "2026-04-01"
  }
}
```

**Response:** `201 Created`
```json
{ "success": true, "eventId": "evt_xxx" }
```

**מה קורה בעיבוד:**
1. אימות חתימה (HMAC SHA256) — ניתן לדלג בסביבת staging
2. בדיקת idempotency — אם event_id כבר קיים, מחזיר 200 ולא מעבד שוב
3. שמירה ב-SQLite
4. **מיד** מחזיר 201 ל-Lusha (לא לחכות לעיבוד)
5. עיבוד אסינכרוני: שליחת push notification

---

### 3. `POST /api/register-device` — רישום מכשיר נייד
האפליקציה קוראת ל-endpoint הזה בהפעלה, כדי לרשום את ה-Expo push token.

**Body:**
```json
{
  "token": "ExponentPushToken[xxx]",
  "platform": "android",   // "ios" | "android"
  "userId": 1              // אופציונלי — ברירת מחדל: משתמש ראשון ב-DB
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": 1,
    "platform": "android",
    "userId": 1
  }
}
```

---

### 4. `GET /api/register-device` — רשימת מכשירים (debug)
מחזיר את כל המכשירים הפעילים הרשומים.

---

### 5. `POST /api/register` — רישום entities ל-webhook
רישום אנשי קשר/חברות שרוצים לקבל signals עליהם. השרת:
1. מעשיר את ה-entity ב-Lusha API (מקבל personId/companyId)
2. יוצר webhook subscription ב-Lusha
3. שומר את הנתונים ב-DB המקומי

**Body:**
```json
{
  "phoneNumber": "+972501234567",
  "notificationChannel": "sms",
  "entities": [
    { "type": "person", "key": "email@company.com", "name": "John Doe" },
    { "type": "company", "key": "company.com", "name": "Company Inc" }
  ],
  "lushaApiKey": "optional-override",
  "signals": ["allSignals"]
}
```

**סוגי signals תקינים ב-Lusha:**
- `allSignals` — כל סוגי ה-signals
- `companyChange` — החלפת מקום עבודה
- `promotion` — קידום

---

### 6. `GET /health` — בדיקת חיים
```json
{ "status": "ok", "timestamp": "2026-04-01T10:00:00.000Z" }
```

---

### 7. `POST /api/demo` — שליחת signal דמו (לבדיקות)
שולח webhook מדומה לצורך בדיקה ללא Lusha אמיתי.

---

## Lusha API Endpoints (חיצוני)

השרת קורא ל-Lusha מ-`https://api.lusha.com`:

| Method | Path | תפקיד |
|--------|------|--------|
| `GET` | `/v2/person?email=...` | העשרת איש קשר לקבלת personId |
| `GET` | `/v2/company?domain=...` | העשרת חברה לקבלת companyId |
| `POST` | `/api/subscriptions` | יצירת webhook subscription |
| `GET` | `/api/subscriptions` | רשימת subscriptions פעילות |
| `GET` | `/api/subscriptions/:id` | פרטי subscription ספציפי |
| `DELETE` | `/api/subscriptions/:id` | מחיקת subscription |
| `POST` | `/api/recommendations/contacts` | קבלת recommendations |

**Headers לכל בקשה ל-Lusha:**
```
api_key: <LUSHA_API_KEY>
Content-Type: application/json
```

---

## Expo Push API

השרת שולח notifications דרך `https://exp.host/--/api/v2/push/send`.

**Payload:**
```json
[
  {
    "to": "ExponentPushToken[xxx]",
    "sound": "default",
    "title": "Shmulik Willinger changed jobs",
    "body": "Moved from Old Company to New Company",
    "data": {
      "contact": {
        "name": "Shmulik Willinger",
        "email": "shmulik@company.com"
      },
      "signal": {
        "type": "Company Change",
        "details": {
          "old_company": "Old Company",
          "new_company": "New Company",
          "title": "VP Engineering"
        }
      }
    },
    "priority": "high",
    "badge": 1
  }
]
```

ניתן לשלוח מערך של הודעות לכמה מכשירים בבת אחת.

---

## אפליקציית הנייד (`lusha-signals-mobile`)

### מחסנית טכנית
- React Native + Expo SDK 54
- `expo-notifications` — קבלת push notifications
- `expo-device` — זיהוי שמדובר במכשיר פיזי
- `expo-constants` — גישה לפרטי האפליקציה (projectId)

### app.json
```json
{
  "expo": {
    "name": "Lusha Signals",
    "slug": "lusha-signals-mobile",
    "android": { "package": "com.lusha.signals" },
    "ios": { "bundleIdentifier": "com.lusha.signals" }
  }
}
```

### זרימה באפליקציה
1. **הפעלה** — מבקשת הרשאות notifications
2. **רישום** — Expo מחזירה `ExponentPushToken[...]` ייחודי למכשיר
3. **שליחה לשרת** — `POST /api/register-device` עם ה-token
4. **האזנה** — `addNotificationReceivedListener` (כשהאפליקציה פתוחה)
5. **tap על notification** — `addNotificationResponseReceivedListener` (כשהאפליקציה ברקע)
6. **הצגה** — Signal מתווסף לרשימה עם כל הפרטים

### כתובת השרת
```javascript
// ב-App.js, פונקציה sendTokenToServer:
'https://delightless-psychologically-kathline.ngrok-free.dev/api/register-device'
```
> **שים לב:** כתובת ה-ngrok משתנה בכל הפעלה אלא אם משתמשים ב-ngrok static domain.

---

## זרימה מלאה — דוגמה end-to-end

```
1. [Lusha API] מזהה שאיש קשר החליף עבודה
       │
       ▼
2. [Lusha] POST /webhooks/lusha  (via ngrok)
   Body: { id: "evt_123", signal_type: "companyChange", ... }
       │
       ▼
3. [Node.js Server] מקבל את ה-webhook
   - מאמת חתימה (אם מוגדר secret)
   - בודק שevent_id לא כבר קיים
   - שומר ב-SQLite
   - מחזיר 201 ל-Lusha מיידית
       │
       ▼
4. [Node.js Server] עיבוד אסינכרוני (setImmediate)
   - מוצא את המשתמש ב-DB
   - מוצא את המכשיר הרשום (Expo token)
   - מפרמט notification
       │
       ▼
5. [Expo Push API] POST https://exp.host/--/api/v2/push/send
   Body: [{ to: "ExponentPushToken[xxx]", title: "...", ... }]
       │
       ▼
6. [Mobile App] מקבל push notification
   - אם האפליקציה פתוחה: NotificationReceivedListener
   - אם ברקע: NotificationResponseReceivedListener (אחרי tap)
       │
       ▼
7. [UI] Signal מוצג בכרטיסייה עם פרטי איש הקשר
```

---

## הגדרת ngrok

ngrok מאפשר ל-Lusha להגיע לשרת המקומי. להפעלה:
```bash
ngrok http 3000
# מקבלים URL כמו: https://abc123.ngrok-free.dev
```

יש לעדכן את `WEBHOOK_BASE_URL` ב-`.env` בהתאם, ולרשום מחדש את ה-webhooks ב-Lusha.

לשימוש ב-static domain (אם יש תשלום):
```bash
ngrok http --domain=delightless-psychologically-kathline.ngrok-free.dev 3000
```

---

## מבנה DB (SQLite)

השרת שומר את כל הנתונים ב-`data/lusha-webhooks.db`.

**טבלאות עיקריות:**
- `users` — משתמשים (phone_number, notification_channel)
- `entities` — אנשי קשר/חברות שמנוטרים + subscription_id של Lusha
- `events` — webhook events שהתקבלו
- `deliveries` — מעקב אחרי שליחת notifications
- `devices` — Expo push tokens של מכשירים מחוברים

---

## הפעלה מהירה מאפס

```bash
# 1. הפעל את השרת
cd cursor-actions/webhooks
cp .env.example .env   # ערוך עם ה-API keys
npm install
npm start

# 2. הפעל ngrok
ngrok http 3000

# 3. רשום webhook ב-Lusha (dashboard)
# URL: https://<ngrok-url>/webhooks/lusha
# Events: allSignals / companyChange / promotion

# 4. הפעל את האפליקציה על מכשיר פיזי
cd cursor-actions/lusha-signals-mobile
npm install
npx expo start
# פתח ב-Expo Go על הטלפון
```
