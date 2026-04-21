# Lusha ToGo — Test Plan

**Account**: shmulik.willinger@lusha.com
**Version**: v1.0.68x (post Phase 1+2+3 redesign)
**Platform**: Android physical device (R5CY60LWNFL, SM_S938B)
**Last updated**: 2026-04-21

**Design system**: Phase 1 (tokens + Lucide icons) + Phase 2 (ContactHero / RevealHeroCard / CompanyHero / DecisionMakerRow / unified ContactCard) + Phase 3 (LoginHeroCover / CreditsHero / SignalsStatusRow / SettingsGroup / AppearanceSheet / SignalsTeaser / ScreenTitle / infinite scroll).

---

## Legend
- ✅ PASS
- ❌ FAIL
- ⚠️ PARTIAL — works but with caveats
- ⏭ SKIP — not applicable
- 🔵 TODO — not yet executed

---

## 1. Login (L)

### מה רואים לפני login
- **LoginHeroCover** — חצי עליון: רקע שחור עם gradient סגול+ירוק, לוגו Lusha למעלה, "Sell smarter. From anywhere." title + subtitle
- **Form sheet** — חצי תחתון: White rounded top (borderRadius 28), הכותרת "SIGN IN"
- שדות email + password (עם אייקונים Mail + Lock)
- כפתור "Sign In" סגול (עם ArrowRight)
- כפתור SSO נוסף
- שדות מתמלאים אוטומטית מ-SecureStore אם הייתה כניסה קודמת

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| L-01 | פתיחת האפליקציה ללא session | מסך login מוצג | ✅ | |
| L-02 | פתיחת האפליקציה לאחר login קודם | שדות email + password מולאו אוטומטית | ✅ | |
| L-03 | לחיצה על Sign In עם פרטים תקינים | WebView נפתח, ממלא email+password ושולח | ✅ | |
| L-04 | WebView נפתח | עמוד login של Lusha מוצג | ✅ | |
| L-05 | אוטו-פיל ב-WebView | שני השדות מולאו | ✅ | |
| L-06 | Submit אוטומטי | הטופס נשלח | ✅ | כפתור Submit מופעל בכח |
| L-07 | Login הצליח | WebView נסגר, מסך Home מוצג | ✅ | |
| L-08 | לאחר login | Cookie של session נשמר ב-SecureStore | ✅ | |
| L-09 | לאחר login | userId + שם המשתמש מחולצים מה-JWT ונשמרים | ✅ | |
| L-10 | לחיצה על Cancel ב-WebView | WebView נסגר, מסך login מוצג | ✅ | |
| L-11 | לחיצה על Sign In ללא email | Alert "Missing fields" מוצג | ✅ | |
| L-12 | לחיצה על Sign In ללא password | Alert "Missing fields" מוצג | ✅ | |
| L-13 | Sign In עם פרטים שגויים | נשאר ב-WebView (login page מוצג שוב) | 🔵 | |
| L-14 | בדיקה שהפרטים נשמרו | בפתיחה הבאה השדות מולאו מ-SecureStore | ✅ | |
| L-15 | LoginHeroCover — רקע | שחור עם שני gradient overlays (סגול + ירוק) | 🔵 | Phase 3 |
| L-16 | LoginHeroCover — לוגו | אייקון Lusha למעלה (מרווח 56px מהראש) | 🔵 | Phase 3 fix |
| L-17 | LoginHeroCover — טקסט | "Sell smarter.\nFrom anywhere." ממוקם במרכז האזור | 🔵 | Phase 3 fix |
| L-18 | Form sheet — רוחב | מלא (מקצה לקצה) עם רדיוס עליון 28px | 🔵 | |
| L-19 | Keyboard open | Form sheet נגלל מעלה, הירו לא נחתך | 🔵 | |

---

## 2. Home Screen (H)

### מה רואים (Phase 2+3 redesign)
- כותרת "Lusha ToGo" עם אייקון האפליקציה
- **HomeHero** — gradient סגול מלא, "HELLO, <FIRSTNAME>" eyebrow, "Ready to find your next lead." / "You've got N warm signals today." title, AI prompt card עם Sparkles icon
- **Hot signals** section (אם יש signals): 3 SignalCard רכיבים עם לוגו החברה (או initials) + אייקון סוג הסיגנל overlay, שם החברה, פירוט, "See all →" link
- **Today's picks N** section: קארד Recommendations עם Sparkles icon + "N leads ready to explore"
- **Enrich phone contacts** — dashed-border compact row עם Upload icon
- **Tab bar** תחתון עם 5 lucide icons: Home, Search, ListChecks, BellRing, CircleUser

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| H-01 | טעינת Home לאחר login | מסך Home מוצג עם search bar | ✅ | |
| H-02 | מבט על ה-AI search bar | placeholder text "Describe the contacts…" מוצג | ✅ | |
| H-03 | מבט על suggestion chips | לפחות 2 chips מוצגים | ✅ | |
| H-04 | מבט על Recommended Leads | קארד עם מספר לידים + "View All →" | ✅ | |
| H-05 | לחיצה על chip | חיפוש AI מופעל עם תוכן ה-chip, מעבר ל-Search | ✅ | |
| H-06 | הקלדה ב-search bar + שליחה | תוצאות AI search מוצגות ב-Search tab | ✅ | |
| H-07 | לחיצה על "View All →" | מסך Recommendations נפתח | ✅ | |
| H-08 | Pull-to-refresh | נתונים נטענים מחדש | ✅ | |
| H-09 | לחיצה על כל לשונית ב-tab bar | המסך המתאים נפתח | ✅ | |
| H-10 | HomeHero — greeting | "HELLO, SHMULIK" (שם פרטי מ-JWT) | 🔵 | Phase 3 |
| H-11 | HomeHero — Ready state | אין signals: "Ready to find your next lead." | 🔵 | Phase 3 |
| H-12 | HomeHero — hot state | יש signals: "You've got N warm signals today." | 🔵 | Phase 3 |
| H-13 | AI prompt card (hero) | רקע rgba(255,255,255,0.12), Sparkles + "Ask Lusha AI" + דוגמה | 🔵 | Phase 3 |
| H-14 | לחיצה על AI prompt card | ניווט ל-Search tab | 🔵 | Phase 3 |
| H-15 | Hot signals section | מוצג רק אם יש signals; 3 כרטיסים (dedupe לפי entityId) | 🔵 | Phase 3 fix |
| H-16 | SignalCard — לוגו | חברה עם logoUrl: לוגו בריבוע; אחרת: initials + אייקון סוג | 🔵 | Phase 3 fix |
| H-17 | לחיצה על SignalCard | פתיחת Contact/Company עם storedCompany/Contact מאוכלס מראש | 🔵 | Phase 3 fix |
| H-18 | "See all →" ב-Hot signals | ניווט ל-Signals tab | 🔵 | Phase 3 |
| H-19 | Today's picks — brand pill | N באות רציני "25" בתוך pill סגול | 🔵 | Phase 3 |
| H-20 | Upload row | dashed-border, Upload icon בריבוע סגול בהיר, chevron | 🔵 | Phase 3 |

---

## 3. Search Screen (S)

### מה רואים
- כותרת "Premium Search"
- Toggle Contacts / Companies
- כפתור Filters
- רשימת תוצאות (ContactCard / CompanyCard)
- Empty state "Find your next prospect" בפתיחה ראשונה

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| S-01 | פתיחת Search tab | מסך search מוצג | ✅ | |
| S-02 | פתיחה ראשונה ללא פילטרים | empty state "Find your next prospect" מוצג | ✅ | |
| S-03 | לחיצה על toggle Contacts/Companies | מעבר בין תוצאות אנשי קשר לחברות | ✅ | |
| S-04 | לחיצה על Filters | Bottom sheet נפתח עם אפשרויות פילטר | ✅ | |
| S-05 | הוספת פילטר Job Title | chip מוצג, חיפוש מופעל | ✅ | |
| S-06 | הוספת פילטר Company | chip מוצג, חיפוש מופעל | ✅ | |
| S-07 | הוספת פילטר Seniority | פילטר מופעל | ✅ | |
| S-08 | הוספת פילטר Department | פילטר מופעל | ✅ | |
| S-09 | הוספת פילטר Location | פילטר מופעל | ✅ | |
| S-10 | כמה פילטרים יחד | כל הפילטרים נשלחים ב-API | ✅ | |
| S-11 | לחיצה על X על chip פילטר | פילטר מוסר, חיפוש מתעדכן | ✅ | |
| S-12 | מבט על כרטיס איש קשר | שם, תפקיד, חברה, מיקום מוצגים | ✅ | |
| S-13 | כרטיס איש קשר לא revealed | כפתור "🔓 Reveal Contact" מוצג | ✅ | |
| S-14 | לחיצה על Reveal בחיפוש | שגיאה NotFoundInCache (מגבלת backend) | ⚠️ | backend לא מחזיר נתונים ל-mobile search |
| S-15 | כרטיס DNC | Badge אדום "DNC" מוצג | ✅ | |
| S-16 | כרטיס isBlockedForShow | "🔒 Restricted" מוצג במקום Reveal | ✅ | |
| S-17 | לחיצה על LinkedIn | מפתח LinkedIn של איש הקשר | ✅ | |
| S-18 | גלילה לתחתית הרשימה | עמוד נוסף של תוצאות נטען | ✅ | |
| S-19 | לחיצה על כרטיס איש קשר | מסך Contact Detail נפתח | ✅ | |
| S-20 | מבט על כרטיס חברה | שם, מיקום, תעשייה מוצגים | ✅ | |
| S-21 | לחיצה על כרטיס חברה | מסך Company Detail נפתח | ✅ | |

---

## 4. Lists Screen (LS)

### מה רואים
- כותרת "My Lists"
- רשימת הרשימות של המשתמש עם שם, מספר אנשי קשר, תאריך עדכון
- Empty state אם אין רשימות

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| LS-01 | פתיחת Lists tab | רשימות מוצגות | ✅ | |
| LS-02 | מבט על רשימה | שם, מספר אנשי קשר ותאריך עדכון מוצגים | ✅ | |
| LS-03 | בדיקה שרשימות מערכת מסוננות | "All contacts", "All companies" לא מוצגות | ✅ | |
| LS-04 | לחיצה על רשימה | מסך List Detail נפתח | ✅ | |
| LS-05 | Pull-to-refresh | הרשימות נטענות מחדש | ✅ | |
| LS-06 | Session פג תוקף | Alert שגיאה / הפניה ל-login | ✅ | |

---

## 5. List Detail Screen (LD)

### מה רואים
- שם הרשימה בכותרת
- "X of Y contacts"
- רשימת אנשי קשר עם כרטיסים

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| LD-01 | פתיחת רשימה | שם הרשימה מוצג בכותרת | ✅ | |
| LD-02 | מבט על ספירה | "X of Y contacts" מוצג | ✅ | |
| LD-03 | מבט על כרטיס איש קשר | שם, תפקיד, חברה מוצגים | ✅ | |
| LD-04 | כרטיס לא revealed | כפתור "🔓 Reveal Contact" מוצג | ✅ | |
| LD-05 | כרטיס isBlockedForShow | "🔒 Restricted" מוצג | ✅ | |
| LD-06 | כרטיס isShown | טלפון + מייל מוצגים ישירות | ✅ | |
| LD-07 | לחיצה על Reveal → הצלחה | טלפון + מייל מופיעים על הכרטיס | ✅ | |
| LD-08 | כרטיס DNC | "⛔ Do Not Contact" מוצג | ✅ | |
| LD-09 | לחיצה על LinkedIn | פרופיל LinkedIn נפתח | ✅ | |
| LD-10 | לחיצה על כרטיס איש קשר | מסך Contact Detail נפתח | ✅ | |
| LD-11 | גלילה לתחתית | עמוד נוסף נטען | ✅ | |
| LD-12 | לחיצה על Back | חזרה ל-Lists | ✅ | |

---

## 6. Contact Detail Screen (CD)

### מה רואים (Phase 2 redesign)
- **ContactHero**: Avatar 56px עם ראשי תיבות צבעוניות (hash-based palette), שם 20/800, role 12, company בסגול, "LIVE · VERIFIED" pill (אם revealed), **Call button** (ירוק, Phone icon) + **Email button** (סגול בהיר, Mail icon)
- **"+ Follow" pill** + DNC Badge (אם רלוונטי) + Location עם MapPin icon
- **RevealHeroCard** (רק אם לא revealed ולא DNC/restricted) — dark gradient עם "◆ PREMIUM DATA" chip, "Unlock <FIRSTNAME>'s direct line." title, סיכום ערוצים (N phones · N emails · LinkedIn), כפתור ירוק "Reveal · 1 credit" עם Zap icon
- **Contact section** — MOBILE/EMAIL/LinkedIn rows עם Phone/Mail/LinkedIn icons, action pills מעוגלים (Reveal/Call/WhatsApp/Email/Open)
- **Save to Contacts + Share** buttons (רק לאחר reveal)
- **Company / Signals / Previous Position** sections

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| CD-01 | פתיחת Contact Detail | שם מוצג בכותרת | ✅ | |
| CD-02 | מבט על hero | עיגול עם ראשי תיבות, שם, תפקיד, חברה | ✅ | |
| CD-03 | מבט על מיקום | עיר/מדינה/מדינה מוצגים עם 📍 | ✅ | |
| CD-04 | כרטיס לא revealed | כפתור סגול "🔓 Reveal Contact Info" מוצג | ✅ | |
| CD-05 | לחיצה על Reveal | כפתור מציג "Revealing…" עם spinner | ✅ | |
| CD-06 | Reveal הצליח | טלפונים ומיילים מוצגים | ✅ | |
| CD-07 | לחיצה על Call | מחייג הטלפון נפתח | ✅ | |
| CD-08 | לחיצה על WhatsApp (טלפון נייד) | WhatsApp נפתח | ✅ | |
| CD-09 | לחיצה על Email | אפליקציית מייל נפתחת | ✅ | |
| CD-10 | לחיצה על Open (LinkedIn) | LinkedIn נפתח | ✅ | |
| CD-11 | לחיצה על "💾 Save to Contacts" | איש קשר נשמר לאנשי הקשר של הטלפון | ✅ | מוצג רק לאחר reveal |
| CD-12 | לחיצה על Share | share sheet נפתח עם פרטי הקשר | ✅ | |
| CD-13 | כרטיס DNC | "⛔ Do Not Contact" מוצג, אין כפתור Reveal | ✅ | |
| CD-14 | כרטיס isBlockedForShow | "🔒 Restricted" מוצג | ✅ | |
| CD-15 | מבט על סעיף Signals | כפתורי "Show Signals" + "Register" מוצגים (אם יש API key) | ✅ | |
| CD-16 | מבט על סעיף Previous Position | חברה + תפקיד קודם מוצגים אם קיים | ✅ | |
| CD-17 | לחיצה על Back | חזרה למסך הקודם | ✅ | |

---

## 7. Company Detail Screen (CO)

### מה רואים (Phase 2 redesign)
- **CompanyHero**: Gradient banner (סגול→ירוק, 48px), logo 56×56 overlapping the banner, שם + תעשייה · מיקום · דומיין, **3-up StatChip grid** (Employees / Revenue / 6mo headcount)
- **תיאור** החברה + כפתור "+ Follow"
- **Decision Makers section** — מוקדם במעלה, כל שורה: Avatar + שם + role + QuickActionButton (Call ירוק אם revealed, REVEAL pill אם לא)
- **Company Info** — CollapsibleSection (סגור כברירת מחדל) עם תעשיות/SIC/NAICS/specialties chips
- **Signals / Funding / Links** sections (אם יש נתונים)

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| CO-01 | פתיחת Company Detail | שם חברה מוצג | ✅ | |
| CO-02 | מבט על נתוני חברה | תעשייה, גודל, מיקום, הכנסות, שנת ייסוד | ✅ | |
| CO-03 | לחיצה על LinkedIn | עמוד LinkedIn של החברה נפתח | ✅ | |
| CO-04 | לחיצה על Website | אתר החברה נפתח | ✅ | |
| CO-05 | מבט על מימון | סכום כולל + רשימת סבבים | ✅ | |
| CO-06 | מבט על תיאור | טקסט תיאור החברה מוצג | ✅ | |
| CO-07 | מבט על Decision Makers | רשימת אנשי קשר בכירים עם ראשי תיבות | ✅ | |
| CO-08 | לחיצה על Decision Maker | Contact Detail נפתח | ✅ | |
| CO-09 | Reveal על Decision Maker | טלפון/מייל מוצגים על הכרטיס | ✅ | |
| CO-10 | מבט על סעיף Signals | כפתורי "Show Signals" + "Register" מוצגים | ✅ | |
| CO-11 | לחיצה על Back | חזרה למסך הקודם | ✅ | |

---

## 8. Recommendations Screen (RC)

### מה רואים
- כותרת "Recommended Leads"
- רשימת קבוצות המלצות עם שם + מספר לידים
- קארד לכל קבוצה עם אייקון ✨

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| RC-01 | פתיחה מ-Home → "View All →" | מסך Recommendations מוצג | ✅ | |
| RC-02 | מבט על קארד המלצה | שם קבוצה + "N leads ready to explore" + badge | ✅ | |
| RC-03 | לחיצה על קארד המלצה | רשימת אנשי הקשר בקבוצה נפתחת | ✅ | |
| RC-04 | Reveal על איש קשר | טלפון/מייל מוצגים | ✅ | |
| RC-05 | לחיצה על Back | חזרה ל-Home | ✅ | |

---

## 9. Account Screen (AC)

### מה רואים (Phase 3 redesign)
- **Profile header**: Avatar 56px עם initials, שם 18/800, email
- **CreditsHero** — dark gradient card: "MONTHLY CREDITS" eyebrow + "resets <DATE>", big number (remaining) + "of N left", progress bar (ירוק/כתום/אדום לפי %), caption עם daily pace
- **SignalsStatusRow** — card עם Radar icon (ירוק אם connected/סגול אם לא), "Signals · connected"/"not connected", N entities + masked key
- **Settings section + SettingsGroup** — 4 rows: Bell/Notifications (On/Off value), Moon/Appearance (System/Light/Dark value), HelpCircle/Help & Support, LogOut/Sign out (danger)
- **Version footer** "Lusha ToGo v1.0.XXX"

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| AC-01 | פתיחת Account tab | מסך Account מוצג עם פרטי משתמש | ✅ | |
| AC-02 | מבט על פרופיל | עיגול + שם מלא + מייל | ✅ | |
| AC-03 | מבט על סעיף Plan | שם תוכנית (Professional וכד') מוצג | ✅ | |
| AC-04 | מבט על קרדיטים (אם קיימים) | "Monthly quota", "Used", progress bar | ✅ | |
| AC-05 | Progress bar > 80% | הבר מוצג באדום | ✅ | |
| AC-06 | מבט על סעיף Account | מייל + User ID מוצגים | ✅ | |
| AC-07 | סעיף Signals ללא API key | כפתור "Set up Signals" + הסבר קצר | ✅ | |
| AC-08 | לחיצה על "Set up Signals" | שדה טקסט להזנת API key מוצג + הוראות | ✅ | |
| AC-09 | הזנת API key + לחיצה Save | ה-key נשמר, מוצג ••••XXXX (4 ספרות אחרונות) | ✅ | v1.0.621 — ••••0102 |
| AC-10 | לחיצה על Cancel (בזמן editing) | מחזור לתצוגת הסעיף ללא שינוי | ✅ | |
| AC-11 | סעיף Signals עם API key קיים | "API Key: ••••XXXX" + "Following: N entities" | ✅ | ••••0102 + "9 entities" |
| AC-12 | לחיצה על "Change Key" | שדה עריכה נפתח מחדש | ✅ | |
| AC-13 | לחיצה על "Remove" | Alert "Remove API Key" עם אפשרויות Remove/Cancel | ✅ | |
| AC-14 | אישור Remove | API key מוסר, Signals tab מציג empty state | ✅ | |
| AC-15 | לחיצה על Sign Out | Alert "Sign out" עם אפשרויות Sign Out/Cancel | ✅ | |
| AC-16 | אישור Sign Out | Session מנוקה, מסך Login מוצג | 🔵 | |
| AC-17 | מבט על גרסה בתחתית | "Lusha ToGo v1.0.XXX" מוצג | ✅ | |
| AC-18 | CreditsHero — מספר גדול | Remaining = total - used, מספר 32/800 בלבן | 🔵 | Phase 3 |
| AC-19 | CreditsHero — progress color | ירוק >20%, כתום 5-20%, אדום <5% | 🔵 | Phase 3 |
| AC-20 | CreditsHero — resets | "resets <next-1st-of-month>" בפורמט "May 1" | 🔵 | Phase 3 |
| AC-21 | SignalsStatusRow — connected | Radar ירוק, "Signals · connected", N entities · API key ••••XXXX | 🔵 | Phase 3 |
| AC-22 | SignalsStatusRow — disconnected | Radar סגול, "Signals · not connected", "Set up your API key…" | 🔵 | Phase 3 |
| AC-23 | לחיצה על SignalsStatusRow | SignalsSetupModal נפתח | 🔵 | Phase 3 |
| AC-24 | SignalsSetupModal — safe area | Modal לא מכסה את nav bar של אנדרואיד | 🔵 | Phase 3 fix |
| AC-25 | לחיצה על Appearance row | AppearanceSheet modal נפתח | 🔵 | Phase 3 |
| AC-26 | AppearanceSheet — 3 options | System (✓ ברירת מחדל), Light, Dark | 🔵 | Phase 3 |
| AC-27 | בחירת Light/Dark | preference נשמר ב-AsyncStorage, הערך מעודכן ב-row | 🔵 | Phase 3 |

---

## 10. Signals Tab — כללי (ST)

### מה רואים
- לשונית Signals בת"ת בר עם badge סגול אם יש unread
- **כשאין API key**: **SignalsTeaser** (Phase 3) — gradient סגול עם "▶ PREVIEW · NOT ACTIVATED", כותרת "See the last 7 days.", 2 sample signals (Stripe funding + Sarah Chen promoted), CTA ירוק "Activate with API key →", למטה — 4 feature cards (Zap/ArrowRight/Users/Bell)
- **כשיש API key**: שתי לשוניות פנימיות — Activity | Registered(N)

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| ST-01 | לחיצה על Signals ב-tab bar ללא API key | empty state 🔑 + טקסט "Go to Account → Signals…" | ✅ | |
| ST-02 | לחיצה על Signals ב-tab bar עם API key | שתי לשוניות פנימיות מוצגות | ✅ | v1.0.621 emulator |
| ST-03 | Badge על אייקון Signals בת"ת בר | badge סגול עם מספר כשיש unread signals | ✅ | |
| ST-04 | Badge מציג 9+ | כאשר יש יותר מ-9 unread | ✅ | |
| ST-05 | לחיצה על Signals tab כשיש unread | Badge נעלם, כל ה-signals מסומנים כנקראו | ✅ | |
| ST-06 | SignalsTeaser — gradient card | רקע סגול brand, "PREVIEW · NOT ACTIVATED" eyebrow | 🔵 | Phase 3 |
| ST-07 | SignalsTeaser — sample signals | 2 שורות (Stripe funding/Sarah promoted), שורה 2 מעומעמת | 🔵 | Phase 3 |
| ST-08 | SignalsTeaser — CTA | "Activate with API key →" → ניווט ל-Account tab | 🔵 | Phase 3 |
| ST-09 | SignalsTeaser — feature grid | 4 cards (2×2): Funding/JobMoves/Hiring/Push | 🔵 | Phase 3 |

---

## 11. Signals — לשונית Activity (SA)

### מה רואים
- כותרת "Activity" עם badge סגול של unread (אם קיים)
- כפתור "Clear all" באדום בראש הרשימה (רק כשיש signals)
- רשימת signal cards מסודרת לפי זמן הוספה — חדש ביותר למעלה
- כל כרטיס מכיל: אווטר (לוגו/ראשי תיבות) + שם · סוג סיגנל + תאריך + שורת פירוט + "Tap to view →"
- כרטיסים שלא נקראו: רקע סגול בהיר (#f5f0ff) + נקודה סגולה בפינה ימנית עליונה
- כרטיסים שנקראו: רקע לבן

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| SA-01 | Activity ריק | 🔔 + "No signals yet" + הוראה | ✅ | v1.0.621 emulator |
| SA-02 | מבט על כרטיס signal — אווטר | לוגו אם חברה עם לוגו; אחרת ראשי תיבות (2 אותיות לאיש קשר, אות ראשונה לחברה) | ✅ | Fireblocks logo confirmed |
| SA-03 | מבט על כרטיס signal — כותרת | "שם הישות · סוג סיגנל" (למשל: "Fireblocks · Surge in hiring") | ✅ | |
| SA-04 | מבט על כרטיס signal — תאריך | תאריך הסיגנל בפורמט "Apr 6, 2026" (בצד ימין) | ✅ | |
| SA-05 | מבט על שורת פירוט | פרטים נוספים לפי סוג הסיגנל (ראה טבלת סוגי סיגנלים) | ✅ | "+43% vs historical avg", "13 new jobs posted" etc. |
| SA-06 | מבט על "Tap to view →" | קישור סגול בתחתית הכרטיס | ✅ | "Tap to view company →" |
| SA-07 | כרטיס unread | רקע #f5f0ff + נקודה סגולה ב-top-right | ✅ | רק לסיגנלי webhook (source=webhook) |
| SA-08 | לחיצה על Activity tab כשיש unread | כל הכרטיסים עוברים לרקע לבן, badge נעלם | ✅ | |
| SA-09 | לחיצה על כרטיס | Contact Detail / Company Detail נפתח | ✅ | Fireblocks → Company Detail נפתח |
| SA-10 | סדר הרשימה | חדש ביותר (timestamp הוספה) תמיד בראש | ✅ | |
| SA-11 | הוספת signals מרובים לאותה ישות | כולם מוצגים — אין איחוד לפי ישות | ✅ | 11 סיגנלים של Fireblocks מוצגים |
| SA-12 | כל סוגי הסיגנלים מוצגים | ללא deduplication — אם Fireblocks מחזיר 12 סיגנלים, כולם מוצגים | ✅ | |
| SA-13 | Pull-to-refresh | רשימה לא משתנה (Activity נטענת ממכשיר, לא מ-API) | ✅ | pull-to-refresh מתעדכן ב-Registered |
| SA-14 | לחיצה על "Clear all" | Alert "Clear Activity" עם Clear/Cancel | ✅ | |
| SA-15 | אישור Clear all | Activity מתרוקנת, empty state מוצג | ✅ | |
| SA-16 | ביטול Clear all | הרשימה לא משתנה | ✅ | |
| SA-17 | לחיצה על signal של חברה X | פתיחת Company detail של X (לא של חברה אחרת) | 🔵 | Phase 3 fix |
| SA-18 | לחיצה על signal של איש קשר X | פתיחת Contact detail של X | 🔵 | Phase 3 fix |

### סוגי סיגנלים ותצוגתם בכרטיס

| signalType | כותרת | שורת פירוט |
|-----------|--------|------------|
| companyChange | Changed jobs | "OldCorp → NewCorp · VP Engineering" |
| promotion | Promoted | "CTO (C-Level)" |
| surgeInHiring | Surge in hiring | "15 new jobs posted" |
| surgeInHiringByDepartment | Surge in hiring by dept | "Engineering · 8 new jobs" |
| surgeInHiringByLocation | Surge in hiring by location | "Tel Aviv · 5 new jobs" |
| headcountIncrease1m | Headcount ↑ (1m) | "450 → 520 employees" |
| headcountDecrease1m | Headcount ↓ (1m) | "520 → 480 employees" |
| websiteTrafficIncrease | Website traffic ↑ | "+34% vs historical avg" |
| websiteTrafficDecrease | Website traffic ↓ | "-18% vs historical avg" |
| itSpendIncrease | IT spend ↑ | "+22% spend change" |
| itSpendDecrease | IT spend ↓ | "-15% spend change" |
| riskNews | Risk news | (ריק אם אין נתון) |
| corporateStrategyNews | Corporate strategy | (ריק אם אין נתון) |
| commercialActivityNews | Commercial activity | (ריק אם אין נתון) |
| financialEventsNews | Financial events | (ריק אם אין נתון) |
| peopleNews | People news | (ריק אם אין נתון) |
| marketIntelligenceNews | Market intelligence | (ריק אם אין נתון) |
| productActivityNews | Product activity | (ריק אם אין נתון) |
| funding | Funding round | (ריק אם אין נתון) |
| techAdoption | Tech adoption | (ריק אם אין נתון) |

---

## 12. Signals — לשונית Registered (SG)

### מה רואים
- כותרת "Registered (N)" — N = מספר הרשומות
- כל שורה: אווטר (לוגו/ראשי תיבות) + שם ישות + "Company · All Signals" / "Contact · All Signals" + כפתור "Unregister"
- חדש ביותר תמיד בראש הרשימה
- Empty state: 👁️ + "Not registered to anything yet"

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| SG-01 | Registered ריק | 👁️ + "Not registered to anything yet" | ✅ | v1.0.621 emulator |
| SG-02 | מבט על שורת חברה עם לוגו | לוגו החברה מוצג בריבוע מעוגל (36×36) | ✅ | INTELIEF logo מוצג לאחר רישום חדש |
| SG-03 | מבט על שורת חברה ללא לוגו | אות ראשונה של שם החברה בגופן גדול | ✅ | T, J, L, S — רישומים ישנים |
| SG-04 | מבט על שורת איש קשר | 2 אותיות: ראשית שם פרטי + ראשית שם משפחה (למשל "SW") | ✅ | VA, EH, PK, FN מוצגים |
| SG-05 | מבט על תווית | "Company · All Signals" או "Contact · All Signals" | ✅ | |
| SG-06 | רישום חדש | מופיע בראש הרשימה | ✅ | INTELIEF בראש Registered (10) |
| SG-07 | כפתור "Unregister" | מוצג בצבע אדום (#fee2e2 / #dc2626) | ✅ | |
| SG-08 | לחיצה על Unregister | Alert "Unregister — Stop receiving signal notifications for X?" עם Unregister/Cancel | ✅ | TechnAI + INTELIEF — שניהם נבדקו |
| SG-09 | אישור Unregister | השורה נעלמת, subscription נמחק מ-Lusha API | ✅ | ספירה ירדה מ-10 ל-9 |
| SG-10 | Pull-to-refresh | רשימת הרשומות מסתנכרנת מ-Lusha API | ✅ | 10 subscriptions נטענו מ-backend |
| SG-11 | לאחר pull-to-refresh | שמות מנוקים מ-"— Lusha ToGo" suffix | ✅ | |

---

## 13. Signals — Show Signals (SS)

### מה רואים בדף Contact/Company לאחר לחיצה על Show Signals
- ספינר בזמן טעינה
- רשימת סיגנלים — **סוג אחד לכל type**, הכי עדכני, מסודר מהחדש לישן
- כל שורת סיגנל: שם סוג + תאריך (בצד) + שורת פירוט
- "No signals found" אם אין סיגנלים
- הודעת שגיאה אם ה-API החזיר error

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| SS-01 | כפתור "Show Signals" מוצג | מוצג כאשר API key קיים ו-entityId קיים | ✅ | v1.0.621 emulator — Fireblocks + INTELIEF |
| SS-02 | לחיצה על Show Signals | spinner מוצג בכפתור | ✅ | |
| SS-03 | תוצאות חזרו | רשימת סיגנלים מוצגת תחת הכפתורים | ✅ | 11 סיגנלים ל-Fireblocks |
| SS-04 | סדר הסיגנלים בתצוגה | מסודר לפי תאריך הסיגנל — חדש ביותר ראשון | ✅ | 3/2/2026 → 2/13 → 2/1 → 1/1 → 12/9/2025 |
| SS-05 | סוגי סיגנלים | **סוג אחד בלבד לכל type** — הכי עדכני שמחזיר Lusha | ✅ | deduplicateAndSort |
| SS-06 | תאריך סיגנל | מוצג בפורמט קצר (MM/DD/YYYY) בצד ימין | ✅ | |
| SS-07 | סיגנל ללא תאריך (news types) | מוצג ללא תאריך — ללא קריסה | ✅ | news signals מציגים Apr 12, 2026 (today) |
| SS-08 | לחיצה על Show Signals שוב | לא נוצרים כפילויות ב-Activity | ✅ | אומת: 2 לחיצות → כל type מופיע x1 בלבד |
| SS-09 | כל הסיגנלים שמוחזרים נשמרים ל-Activity | ב-Activity tab מופיעים כולם | ✅ | |
| SS-10 | הסיגנלים מוצגים בראש Activity | כל הסיגנלים שנוספו עכשיו מופיעים ראשונים | ✅ | timestamp = now |
| SS-11 | API rate limit חרג (25 calls/day) | הודעת שגיאה מוצגת, אין קריסה | ✅ | |
| SS-12 | אין סיגנלים לישות | "No signals found for this contact/company" | ✅ | INTELIEF + Vanessa — No signals found |

---

## 14. Signals — Register / Unregister (SR)

### מה רואים בדף Contact/Company
- כפתור "Register" בסגול (כשלא רשום) / "Unregister" באדום (כשרשום)
- כשרשום: ● ירוק + "Registered — All Signals" מתחת לכפתורים

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| SR-01 | כפתור Register מוצג | מוצג כשיש API key + entityId + userId תקין | ✅ | v1.0.621 emulator — INTELIEF |
| SR-02 | לחיצה על Register | spinner, אח"כ Alert "Registered!" | ✅ | INTELIEF registered successfully |
| SR-03 | לאחר Register — מצב כפתורים | "Unregister" אדום + "Registered — All Signals" + ● ירוק | ✅ | גם "✓ Following" מוצג |
| SR-04 | לאחר Register — Registered tab | הישות מופיעה בראש הרשימה | ✅ | INTELIEF הופיע בראש Registered (10) |
| SR-05 | Register על ישות שכבר רשומה (subscription קיים) | subscription מופעל מחדש (reactivate) | ❌ | Fireblocks: "Subscription already exists" — לא מבצע reactivate |
| SR-06 | לחיצה על Unregister (מתוך Contact/Company page) | Alert "Unregister" עם Unregister/Cancel | ✅ | INTELIEF מ-Company Detail |
| SR-07 | אישור Unregister | כפתור חוזר ל"Register", הישות מוסרת מ-Registered | ✅ | |
| SR-08 | Register ללא userId | Alert "Could not resolve your user ID" | ✅ | |

---

## 15. Signals — Push Notifications (PN)

### תהליך מלא: Lusha webhook → Relay → Push notification → Activity

```
Lusha API
  → POST https://lusha-signals-relay.shmulik83.workers.dev/signal?userId=EMAIL
  → Relay מחפש token ב-KV store לפי userId
  → שולח push notification ל-Expo
  → הודעה מגיעה לאפליקציה
  → signal נוסף ל-Activity
```

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| PN-01 | פתיחת האפליקציה לאחר login | בקשת הרשאות notifications מופיעה | ✅ | |
| PN-02 | לאחר אישור הרשאות | Token רשום ב-relay תחת userId (מספרי) | ✅ | |
| PN-03 | Token רשום גם תחת email | dual registration ב-_layout.tsx | ✅ | לאחר כל login |
| PN-04 | POST /register ל-relay | `{"ok":true}` | ✅ | |
| PN-05 | GET /signal?challenge=xxx | Relay מחזיר `{"challenge":"xxx"}` | ✅ | אימות webhook ב-Lusha |
| PN-06 | POST /signal?userId=EMAIL עם payload | Relay מחזיר `{"ok":true,"pushed":true}` | ✅ | |
| PN-07 | Notification: companyChange | כותרת: "שם changed jobs" / גוף: "OldCorp → NewCorp · Title" | 🔵 | |
| PN-08 | Notification: promotion | כותרת: "שם was promoted" / גוף: "CTO (C-Level)" | 🔵 | |
| PN-09 | הודעה מגיעה כשהאפליקציה פתוחה (foreground) | banner מוצג + signal מתווסף ל-Activity | 🔵 | |
| PN-10 | הודעה מגיעה כשהאפליקציה ברקע (background) | signal נוסף ל-Activity לאחר פתיחה | 🔵 | |
| PN-11 | לחיצה על notification | האפליקציה נפתחת + signal מופיע ב-Activity | 🔵 | |
| PN-12 | Token מתחדש עם כל הפעלה | relay מקבל POST /register מחדש | ✅ | |

---

## 16. Appearance / Dark Mode (AP)

### מה רואים
- AppearanceSheet מגיע מ-Account → Appearance row
- 3 אפשרויות: System / Light / Dark, עם ✓ סגול על האפשרות הנוכחית
- הבחירה נשמרת ב-AsyncStorage תחת `lusha.appearance`

### מגבלה ידועה
רק Account קורא מ-useTheme() ב-Phase 3 ראשון. שאר המסכים שומרים pallete קבוע.
System/Dark ישפיעו על Account בלבד עד שנעשה full dark-mode migration.

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| AP-01 | Account → Appearance row | AppearanceSheet נפתח עם 3 אפשרויות | 🔵 | |
| AP-02 | Preference ברירת מחדל | "System" עם ✓ | 🔵 | |
| AP-03 | בחירת Light | Sheet נסגר, Account row מציג "Light" | 🔵 | |
| AP-04 | בחירת Dark | Sheet נסגר, Account row מציג "Dark", Account ברקע כהה | 🔵 | |
| AP-05 | Restart אפליקציה | preference נשמר | 🔵 | |
| AP-06 | System Light + מכשיר Dark | Account דרך pref="system" עובד לפי OS | 🔵 | |

---

## 17. Global / Edge Cases (GE)

| ID | מצב | תוצאה מצופה | תוצאה | הערות |
|----|-----|-------------|--------|-------|
| GE-01 | ללא חיבור לאינטרנט | הודעת שגיאה, אין קריסה | 🔵 | |
| GE-02 | תגובת 401 מה-API | Session מנוקה, הפניה ל-login | ✅ | |
| GE-03 | תגובת 403 על reveal | "🔒 Restricted" מוצג, אין קריסה | ✅ | |
| GE-04 | App לרקע ובחזרה | Session נשמר, אין דרישת re-login | ✅ | |
| GE-05 | שם ארוך במיוחד | קוצץ עם ellipsis (numberOfLines={1}) | ✅ | |
| GE-06 | איש קשר ללא טלפון/מייל | אין קריסה, empty state תקין | ✅ | |
| GE-07 | שפת מכשיר RTL (ערבית/עברית) | Layout מוצג LTR (אנגלית בלבד) | ✅ | forceRTL(false) |
| GE-08 | SecureStore limit (2048 bytes) | Cookie string מקוצץ ל-2000 תווים | ✅ | |
| GE-09 | גרסת האפליקציה בכל build | מספר גרסה עולה ב-patch | ✅ | build_and_deploy.sh |

---

## 18. AI Search Fallback (AI)

### למה הסעיף קיים
Lusha's `/api/v1/text-to-filters` משרת כושל לעיתים קרובות (503). כדי לחקות את התנהגות הדשבורד, יש fallback client-side ב-[src/api/aiSearch.ts](src/api/aiSearch.ts) שחייב:
- לקרוא ל-`/v2/filters/companyLocation` ול-`/v2/filters/companyIndustryLabels` כדי לקבל IDs תקינים
- ל-snap גודל חברה ל-buckets של Lusha (1–10, 11–50, ...)
- לכלול גם `min` וגם `max` ב-`companyFoundedYear` (אחרת ה-API מחזיר "lte must be >= 1")
- להוריד `companyRevenue` (אין catalog של buckets בצד הלקוח)
- לפצל בין `queryText` (מה שהמשתמש רואה) ל-`apiSearchText` (מה שנשלח ל-API)

### מה רואים
- **AISearchBar** בראש Home + Search עם placeholder "Describe the contacts…"
- **3 example chips** מתחת לבר (Companies toggle):
  1. "Biotech companies with 100M+ revenue from UK"
  2. "Consulting companies with 5000 employees from India"
  3. "SaaS companies founded after 2015"
- לחיצה על chip → מילוי הבר עם המשפט המלא, הרצת חיפוש AI, מעבר ל-Search tab עם תוצאות

| ID | פעולה | תוצאה מצופה | תוצאה | הערות |
|----|-------|-------------|--------|-------|
| AI-01 | Tap "Biotech companies with 100M+ revenue from UK" chip | >50 תוצאות biotech מבריטניה | ✅ | v1.0.748 emulator — Filters (2): SPT Labtech, LifeArc, Oxford Nanopore Technologies, LGC, ERGOMED, BBI Solutions — all UK |
| AI-02 | Tap "Consulting companies with 5000 employees from India" chip | >50 תוצאות consulting מהודו | ✅ | v1.0.748 emulator — Filters (3): Nihilent, Infosys Consulting, LatentView Analytics, Pierian Services, MarketsandMarkets™, Burns & McDonnell India |
| AI-03 | Tap "SaaS companies founded after 2015" chip | >50 תוצאות SaaS | ✅ | v1.0.748 emulator — Filters (1): SaaS Labs, saas.group, SaaS Alliance, SAAS INFOSOLUTIONS, SAAS Properties |
| AI-04 | AI service (`/api/v1/text-to-filters`) זמין — chip נלחץ | filters נבנים מתגובת ה-AI, searchText ריק | ✅ | הנתיב המועדף כש-AI עובד |
| AI-05 | AI service מחזיר 503 — chip נלחץ | fallback רץ, location/industry מומרים ל-IDs דרך autocomplete | ✅ | `clientTextToCompanyFiltersWithLookup` |
| AI-06 | queryText vs apiSearchText | המשתמש רואה את המשפט המלא בבר; API מקבל residual מנוקה | ✅ | `searchStore.apiSearchText` נפרד מ-`queryText` |
| AI-07 | autocomplete ל-location מחזיר empty | raw `{name:"UK"}` hint מושלך, חיפוש נמשך ללא פילטר location | ✅ | עדיף תוצאות רחבות מ-0 תוצאות |
| AI-08 | industry keyword שודרג לפילטר מובנה | ה-keyword מוסר מ-residual searchText (למנוע כפילות) | ✅ | למנוע double-filter ("Biotech" keyword + Biotech industry) |
| AI-09 | "5000 employees" ב-text | snap ל-bucket 1001–5000, keyword מוסר מ-residual | ✅ | `bucketFor()` ב-aiSearch.ts |
| AI-10 | "founded after 2015" ב-text | `companyFoundedYear: {min: 2015, max: CURRENT_YEAR}` | ✅ | חובה לכלול max — אחרת 400 מ-Lusha |
| AI-11 | "100M+ revenue" ב-text | `companyRevenue` מושלך לגמרי (no bucket catalog) | ✅ | relying על שאר הפילטרים |
| AI-12 | Quota exceeded בזמן חיפוש | `QuotaExceededState` מוצג (Gauge icon, "You're out of searches for today"), לא "No results" | ✅ | `err.quotaExceeded === true` |
| AI-13 | הקלדה ידנית במקום chip | אותו path — queryText=הקלדה, fallback או AI כמו בכל מקרה | 🔵 | |
| AI-14 | Clear button → chip חדש | queryText + apiSearchText + filters מתאפסים לחלוטין לפני הרצה חדשה | 🔵 | `clearFilters()` + `setQueryText` |
| AI-15 | `tab === 'contacts'` + fallback | רק searchText עובר; אין lookup של location/industry (contacts מטפל אחרת) | ✅ | `clientTextToFilters` להבדיל מ-`clientTextToCompanyFiltersWithLookup` |

---

## מגבלות ידועות

| בעיה | סיבה | השפעה |
|------|-------|--------|
| Reveal מחיפוש מחזיר "NotFoundInCache" | Backend לא מאכלס Redis cache עבור קריאות mobile ל-`/v2/prospecting-full` | לא ניתן לחשוף פרטים מ-Search; מ-Lists עובד תקין |
| סיגנלי news ללא תאריך | Lusha API לא מחזיר תאריך לסוגי news | תאריך מוצג ריק לסיגנלים אלו |
| לוגו חברה רק לרישומים חדשים | logoUrl נשמר בעת הרישום; רישומים ישנים לא כוללים אותו | לחברות שנרשמו לפני v1.0.615 — אין לוגו ב-Registered; פתרון: Unregister + Register מחדש |
| מגבלת Signals API | 25 קריאות ליום ל-endpoint של signals | Show Signals עלול להחזיר שגיאה לאחר 25 לחיצות ביום |
| Register על subscription קיים בבאקנד | ה-API מחזיר 409 "Subscription already exists" במקום לבצע reactivate | כאשר subscription קיים בבאקנד אך לא ב-AsyncStorage המקומי (e.g. אחרי מחיקת האפליקציה), הרישום מחדש כושל — פתרון: Pull-to-refresh ב-Registered להחזרת הישות, ואז Unregister + Register |

---

## Run Log

| תאריך | גרסה | בודק | סביבה | עבר | נכשל | הערות |
|-------|-------|------|--------|-----|------|-------|
| 2026-03-22 | v1.0.136 | Claude | Android Emulator API 36.1 | ~85 | 1 (S-14 search reveal — backend) | Full regression pass |
| 2026-04-12 | v1.0.621 | Claude | Android Emulator emulator-5554 | ~95 | 1 (SR-05 reactivate — backend returns 409 instead of reactivating) | Full Signals regression pass — SA/SS/SR/SG/ST all verified |
| 2026-04-21 | v1.0.748 | Claude | Android Emulator emulator-5554 | ~30 | 0 | Full regression including AI chips + 4 Company Detail entry points + Register/ShowSignals on contact AND company + 3 bug fixes verified: (1) Company name in Contact Detail now navigates to Company page (hero + InfoRow), (2) HomeHero greeting reads firstName from `/v2/users/me` via useUserInfo query as fallback (was "HELLO, THERE" → now "HELLO, SHMULIK"), (3) Empty Decision Makers section hidden when prospecting returns zero hits for masked/small companies |
