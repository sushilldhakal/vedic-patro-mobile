# Vedic Patro Mobile

React Native (Expo) app for **Vedic Patro** — calendar, panchanga, holidays, and AD↔BS converter. Uses the same API as the web app (`https://vedicpatro.com/api`).

## Features

- Bikram Sambat calendar grid with tithi + festival markers
- Daily panchanga (tithi, nakshatra, yoga, karana, muhurta, timeline, wheel)
- **Full sitemap parity** with [vedicpatro.com](https://www.vedicpatro.com): panchanga sub-pages, gochar, graha pages, eclipses, panchak, suryakranti, abhijit, ritu, sait/muhurta, learn articles, kundali & milan
- Nepal holidays list by BS year
- AD ↔ BS date converter
- Nepali / English toggle with Devanagari digits
- **Responsive layout**: phone bottom tabs, tablet/iPad sidebar
- **Fonts**: Mukta (UI) + Fira Code (dates), matching the web app
- Learn articles are **native React Native screens** (bilingual prose, in-app links). **Do not** embed vedicpatro.com or other site pages in a WebView for in-app content.

## Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| phone | < 400px | compact cells, bottom tabs |
| largePhone | 400–767px | slightly larger cells |
| tablet | 768–1023px | sidebar + 2-column content |
| desktop | ≥ 1024px | wider sidebar, split panes |

## Run locally

```bash
cd dhakal-patro-mobile
npm install
npm start
```

`npm start` uses **`expo start --go`** so the QR code opens in **Expo Go** on your phone. Do **not** use the `exp+vedic-patro-mobile://…` link in Expo Go — that URL is only for a custom dev build.

Then press:

- `i` — iOS Simulator (iPhone / iPad)
- `a` — Android emulator
- `w` — web preview

On a **physical phone**: install **Expo Go** (SDK 54), same Wi‑Fi as your Mac, scan the QR from the terminal. The link should look like `exp://192.168.x.x:8081`, not `exp+vedic-patro-mobile://`.

If you previously ran the app on SDK 52, stop the old dev server, reinstall, and clear Metro cache:

```bash
npm install
npx expo start --clear
```

### Can’t open on phone / “exp+vedic-patro-mobile://…”

That URL is for a **development build** (custom “Vedic Patro” app with `expo-dev-client`). **Expo Go ignores it** — the project looks like it “does nothing” when you tap Open.

| Goal | Command |
|------|---------|
| **Phone + Expo Go** (usual) | `npm start` → scan QR; URL must be `exp://…` |
| **Custom dev client** | `npm run start:dev-client` → install app via `npx expo run:ios` or EAS, then scan |

Also check: phone and Mac on the **same Wi‑Fi**, and Metro finished bundling (no red errors in the terminal).

### Local API (optional)

To point at your local FastAPI server instead of production, edit `app.json`:

```json
"extra": {
  "apiBaseUrl": "http://YOUR_LAN_IP:8080",
  "apiVersion": "v1"
}
```

Use your machine's LAN IP (not `localhost`) when testing on a physical phone.

## Project structure

```
app/                 Expo Router screens
components/          UI + calendar grid
lib/                 API, BS calendar, i18n, responsive hooks
assets/              App icons
```

## Tech stack

- Expo SDK 54 + Expo Router 6 (compatible with current Expo Go)
- NativeWind (Tailwind for RN)
- TanStack React Query
- Same BS calendar tables as `dhakal-patro` web app
