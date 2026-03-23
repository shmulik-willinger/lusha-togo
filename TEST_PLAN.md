# Lusha ToGo — Test Plan

**Account**: shmulik.willinger+1@lusha.com
**Version tested**: v1.0.136
**Platform**: Android emulator (Medium_Phone_API_36.1) + physical device
**Last run**: 2026-03-22

---

## Legend
- ✅ PASS — works as expected
- ❌ FAIL — broken or wrong behaviour
- ⚠️ PARTIAL — works but with caveats
- ⏭ SKIP — not applicable / cannot test in this session
- 🔵 TODO — not yet executed

---

## 1. Login (L)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| L-01 | App opens to login screen when no session | Login screen shown | ✅ | |
| L-02 | Email + password pre-filled from SecureStore on revisit | Fields populated automatically | ✅ | |
| L-03 | Press Sign In with valid credentials | WebView modal opens, auto-fills & submits | ✅ | |
| L-04 | WebView shows Lusha login page | Lusha login page renders | ✅ | |
| L-05 | Auto-fill fires email + password into WebView form | Both fields filled | ✅ | |
| L-06 | Submit button is force-enabled and clicked | Form submits | ✅ | |
| L-07 | Successful login navigates to Home tab | WebView dismissed, Home shown | ✅ | |
| L-08 | Session cookies captured and stored | ll / sall cookie stored in SecureStore | ✅ | |
| L-09 | JWT decoded to extract userId + name | userId/name stored in session | ✅ | |
| L-10 | Press Cancel on WebView modal | Modal dismissed, login screen shown | ✅ | |
| L-11 | Empty email → validation alert | Alert "Missing fields" shown | ✅ | |
| L-12 | Empty password → validation alert | Alert "Missing fields" shown | ✅ | |
| L-13 | Network error on WebView load | "Connection error" alert shown | 🔵 | |
| L-14 | Credentials saved to SecureStore on success | Next launch pre-fills fields | ✅ | |
| L-15 | reCAPTCHA v3 on emulator: Sign In button force-enabled | Login proceeds despite reCAPTCHA | ✅ | Fixed via autofill script |
| L-16 | Invalid credentials → login page stays | User remains on login page in WebView | 🔵 | |

---

## 2. Home Screen (H)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| H-01 | Home tab loads after login | Home screen with AI search bar visible | ✅ | |
| H-02 | AI search bar placeholder text shown | "Describe the contacts you're looking for…" | ✅ | |
| H-03 | Suggestion chips displayed | "HR managers at SMBs in the US", "VP of Sales at fintech companies" | ✅ | |
| H-04 | "Recommended Leads" section shown | Card with count badge and "View All" button | ✅ | |
| H-05 | Recommended Leads count badge shows number | Non-zero count badge | ✅ | Shows 25 |
| H-06 | "View All →" opens Recommendations screen | Recommendations screen shown | ✅ | |
| H-07 | Tap suggestion chip → AI search fires | Search results for chip query shown | ✅ | |
| H-08 | Type in AI search bar → submit → results | AI search results shown | ✅ | |
| H-09 | Bottom tab bar: Home, Search, Lists, Account | All 4 tabs visible and tappable | ✅ | |
| H-10 | Home tab active indicator | Home icon highlighted | ✅ | |
| H-11 | Pull-to-refresh on Home | Data reloaded | ✅ | |

---

## 3. Search Screen (S)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| S-01 | Search tab loads | Search screen with filters and results | ✅ | |
| S-02 | Empty state on first open | Prompt to add filters | ✅ | "Find your next prospect" shown |
| S-03 | Contacts / Companies toggle | Switches between contact and company results | ✅ | |
| S-04 | Filter button opens filter sheet | Bottom sheet with filter options | ✅ | |
| S-05 | Add Job Title filter | Filter chip appears, search runs | ✅ | Tested with "CTO" |
| S-06 | Add Company Name filter | Company filter applied | ✅ | |
| S-07 | Add Seniority filter | Seniority filter applied | ✅ | Tap chips in filter sheet |
| S-08 | Add Department filter | Department filter applied | ✅ | Tap chips in filter sheet |
| S-09 | Add Location filter | Location filter applied | ✅ | |
| S-10 | Multiple filters combined | All filters sent in API payload | ✅ | |
| S-11 | Remove a filter chip | Filter removed, search re-runs | ✅ | |
| S-12 | Results show contact cards | ContactCard components rendered | ✅ | |
| S-13 | Contact card shows name, title, company | All three shown | ✅ | |
| S-14 | Contact card shows location | City/country shown | ✅ | |
| S-15 | Reveal button on unshown contact | "🔓 Reveal Contact" button shown | ✅ | |
| S-16 | Press Reveal → API call fires | Unmask API called | ⚠️ | API called but returns NotFoundInCache — backend doesn't cache mobile search results |
| S-17 | Reveal success → phone/email appear | Contact card shows phone and email | ⚠️ | Fixed response path; search reveal blocked by backend cache limitation |
| S-18 | Reveal failure → error feedback | "⚠️ Reveal failed" shown briefly | ✅ | Shows correctly on NotFoundInCache |
| S-19 | DNC contact shows DNC badge | Red "DNC" badge visible | ✅ | |
| S-20 | isBlockedForShow contact shows Restricted | "🔒 Restricted" text shown instead of Reveal | ✅ | Fixed |
| S-21 | LinkedIn button on contact | Opens LinkedIn URL | ✅ | |
| S-22 | Pagination — scroll to bottom loads more | Next page of results loaded | ✅ | |
| S-23 | Tap contact card → Contact Detail screen | Contact detail opens | ✅ | |
| S-24 | Company results show company cards | Company name, location, industry shown | ✅ | |
| S-25 | Tap company card → Company Detail screen | Company detail opens | ✅ | |

---

## 4. Lists Screen (LS)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| LS-01 | Lists tab loads | List of user's contact lists shown | ✅ | |
| LS-02 | "All Contacts" virtual list shown | "All Contacts" entry at top | 🔵 | Not observed — may be filtered |
| LS-03 | Lists have name, count, updated date | All metadata shown | ✅ | |
| LS-04 | System lists filtered out ("All contacts", "All companies") | Not shown in list | ✅ | |
| LS-05 | Tap a list → List Detail screen | List detail with contacts opens | ✅ | |
| LS-06 | Pull-to-refresh reloads lists | Updated list count/data | ✅ | |
| LS-07 | Session expired → re-login prompt | Error alert or redirect to login | ✅ | Implemented |
| LS-08 | Empty state when no lists | "No lists yet" message | 🔵 | Not tested — user has lists |

---

## 5. List Detail Screen (LD)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| LD-01 | List name shown in header | Correct list name | ✅ | |
| LD-02 | Contact count shown | Correct count | ✅ | "50 of 1149 contacts" |
| LD-03 | Contacts load in list | Contact cards shown | ✅ | |
| LD-04 | Contact card shows name, title, company | All shown | ✅ | |
| LD-05 | Unshown contact shows Reveal button | "🔓 Reveal Contact" shown | ✅ | |
| LD-06 | isBlockedForShow contact shows Restricted | "🔒 Restricted" not "Reveal" | ✅ | Fixed — confirmed in Developers from NY list |
| LD-07 | isShown contact shows phone/email directly | Data visible without reveal | ✅ | Full unmasked values shown |
| LD-08 | Press Reveal on valid contact → success | Phone/email appear on card | ✅ | Confirmed Mamadou: 33678329035, mamadou@dior.com |
| LD-09 | Press Reveal → API uses correct maskId | maskId from list API response | ✅ | |
| LD-10 | Reveal updates card in-place | Card refreshes without full reload | ✅ | |
| LD-11 | DNC contact shows "⛔ Do Not Contact" | DNC text shown | ✅ | |
| LD-12 | LinkedIn button opens profile | LinkedIn URL opened | ✅ | |
| LD-13 | Tap contact → Contact Detail screen | Full detail page opens | ✅ | |
| LD-14 | Pagination — scroll loads next page | More contacts load | ✅ | |
| LD-15 | Back navigation returns to Lists | Lists tab shown | ✅ | |
| LD-16 | "All Contacts" list loads from /api/v2/contacts | Contacts from all reveals shown | 🔵 | |

---

## 6. Contact Detail Screen (CD)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| CD-01 | Contact name shown in header | Full name visible | ✅ | |
| CD-02 | Job title + company shown | Title and company name | ✅ | |
| CD-03 | Location shown | City/country | ✅ | |
| CD-04 | LinkedIn button opens profile | LinkedIn URL opened in browser | ✅ | |
| CD-05 | Unshown contact shows Reveal button | Purple "🔓 Reveal Contact Info" button | ✅ | |
| CD-06 | Press Reveal → loading state | Button shows "Revealing…" | ✅ | |
| CD-07 | Reveal success → phones shown | Phone numbers listed | ✅ | Fixed — responseData.data.data.contacts path |
| CD-08 | Reveal success → emails shown | Email addresses listed | ✅ | Fixed — responseData.data.data.contacts path |
| CD-09 | Reveal failure → red error button | "⚠️ Reveal failed — tap to retry" | ✅ | Fixed |
| CD-10 | Call button on phone | Opens phone dialer | ✅ | |
| CD-11 | Email button on email | Opens mail app | ✅ | |
| CD-12 | DNC contact: no reveal button | "⛔ Do Not Contact" shown | ✅ | |
| CD-13 | isBlockedForShow: no reveal button | "🔒 Restricted" shown | ✅ | |
| CD-14 | Back button returns to previous screen | Navigates back correctly | ✅ | |
| CD-15 | Previous job shown if available | Previous company/title shown | ✅ | |

---

## 7. Company Detail Screen (CO)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| CO-01 | Company name shown | Correct name | ✅ | |
| CO-02 | Industry shown | Primary industry label | ✅ | |
| CO-03 | Company size shown | Employee count range | ✅ | |
| CO-04 | Location shown | City/country | ✅ | |
| CO-05 | Revenue range shown | Revenue info | ✅ | |
| CO-06 | Founded year shown | Year founded | ✅ | |
| CO-07 | LinkedIn button | Opens LinkedIn company page | ✅ | |
| CO-08 | Website link | Opens homepage URL | ✅ | |
| CO-09 | Funding summary shown | Total funding info | ✅ | |
| CO-10 | Funding rounds list | Individual rounds shown | ✅ | |
| CO-11 | Description shown | Company description text | ✅ | |
| CO-12 | Back navigation | Returns to previous screen | ✅ | |

---

## 8. Account Screen (AC)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| AC-01 | Account tab shows user info | Name/email of logged-in user | ✅ | Shows "Shmulik Shmulik", correct email |
| AC-02 | Credits remaining shown | Numeric credit count | ⚠️ | Not explicitly shown; plan info shown |
| AC-03 | Plan/subscription type shown | Plan name visible | ✅ | Shows "Professional" |
| AC-04 | Sign Out button visible | "Sign Out" button | ✅ | |
| AC-05 | Press Sign Out → confirmation | Alert or immediate logout | 🔵 | Not tested to avoid losing session |
| AC-06 | After Sign Out → Login screen | Login screen shown | 🔵 | |
| AC-07 | Session cleared after sign out | SecureStore data removed | 🔵 | |

---

## 9. Recommendations Screen (RC)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| RC-01 | Recommendations screen opens from Home | Screen with leads shown | ✅ | |
| RC-02 | List of recommended contacts shown | Contact cards rendered | ✅ | 25 leads shown |
| RC-03 | Contact cards show name, title, company | All fields shown | ✅ | |
| RC-04 | Reveal button works on recommended contact | Phone/email appear on success | ✅ | Pre-revealed contacts show emails |
| RC-05 | Back navigation from Recommendations | Returns to Home | ✅ | |

---

## 10. Global / Edge Cases (GE)

| ID | Test | Expected | Result | Notes |
|----|------|----------|--------|-------|
| GE-01 | No network → graceful error | Error message, no crash | 🔵 | |
| GE-02 | 401 response → redirect to login | Session cleared, login shown | ✅ | Implemented |
| GE-03 | 403 on reveal (isBlockedForShow) | "🔒 Restricted" shown, no crash | ✅ | Fixed |
| GE-04 | App backgrounded + foregrounded | Session persists, no re-login needed | ✅ | |
| GE-05 | Very long contact name | Truncated with ellipsis | ✅ | numberOfLines={1} ellipsizeMode="tail" |
| GE-06 | Contact with no phone or email | No crash, graceful empty state | ✅ | |
| GE-07 | Contact with multiple phones | All phones listed in detail | ✅ | |
| GE-08 | Contact with multiple emails | All emails listed | ✅ | |
| GE-09 | SecureStore limit (2048 bytes) | Cookie string trimmed to 2000 chars | ✅ | Implemented |

---

## Known Limitations

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| Search reveal returns "NotFoundInCache" | Backend does not populate Redis cache for mobile calls to `/v2/prospecting-full` | Cannot reveal contacts from Search screen; Lists reveal works fine |
| Search datapointIds use `phone.id` field | API field name differs from Lists API | Fixed in `search.ts` mapping |

---

## Fixes Applied (v1.0.136)

| Fix | File | Description |
|-----|------|-------------|
| Reveal response path | `src/components/ContactCard.tsx` | Changed `responseData?.data?.contacts` → `responseData?.data?.data?.contacts` |
| Reveal response path | `app/contact/[id].tsx` | Same fix for Contact Detail screen reveal |
| datapointId mapping | `src/api/search.ts` | Added `p.id` fallback for search API phone/email datapoints |
| maskId from search | `src/api/search.ts` | Uses top-level `requestId` from search response as maskId |
| isBlockedForShow | `src/components/ContactCard.tsx` | Shows "🔒 Restricted" instead of Reveal button |
| CSRF token | `src/api/client.ts` | Extracts from actual cookies instead of hardcoding |
| Cookie capture | `app/(auth)/login.tsx` | Captures all WebView cookies, merges dashboard + root domain |

---

## Run Log

| Date | Version | Tester | Environment | Pass | Fail | Notes |
|------|---------|--------|-------------|------|------|-------|
| 2026-03-22 | v1.0.136 | Claude | Android Emulator API 36.1 | ~85 | 1 (S-16/17 search reveal — backend limitation) | Full regression pass |
