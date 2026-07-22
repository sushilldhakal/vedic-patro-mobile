# Vedic Patro Mobile

React Native (Expo) app for **Vedic Patro** — calendar, panchanga, holidays, and AD↔BS converter. Uses the same API as the web app (`https://vedicpatro.com/api`).

## Features

- Bikram Sambat calendar grid with tithi + festival markers
- Daily panchanga (tithi, nakshatra, yoga, karana, muhurta)
- Nepal holidays list by BS year
- AD ↔ BS date converter
- Nepali / English toggle with Devanagari digits
- **Responsive layout**: phone bottom tabs, tablet/iPad sidebar
- **Fonts**: Mukta (UI) + Fira Code (dates), matching the web app

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

Then press:

- `i` — iOS Simulator (iPhone / iPad)
- `a` — Android emulator
- `w` — web preview

Or scan the QR code with **Expo Go** on a physical device (requires **Expo SDK 54** — matches current Expo Go from the App Store / Play Store).

If you previously ran the app on SDK 52, stop the old dev server, reinstall, and clear Metro cache:

```bash
npm install
npx expo start --clear
```

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
