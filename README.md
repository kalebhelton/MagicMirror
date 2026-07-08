# Smart Mirror

Next.js dashboard for a DIY smart mirror (two-way mirror + HDMI display driven
by a small PC/Pi behind the glass). MVP modules: Date/Time, Weather, Google
Calendar (month view). Other modules from the plan are stubbed in as dimmed
placeholders so the layout is already in place when you add them.

## 1. Install

```bash
npm install
```

## 2. Google Calendar setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. Enable the **Google Calendar API** (APIs & Services → Library).
3. APIs & Services → Credentials → **Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3005/oauth2callback`
4. Copy the Client ID and Client Secret.
5. Copy `.env.local.example` to `.env.local` and fill in `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`.
6. Run the one-time token script:
   ```bash
   npm run get-google-token
   ```
   This opens a URL for you to visit in a browser, approve access to your own
   calendar, and prints a `GOOGLE_REFRESH_TOKEN` value — paste that into
   `.env.local` too.

Your server now has long-lived, read-only access to your primary calendar.
The refresh token doesn't expire from regular use, only if you manually
revoke access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## 3. Weather

Uses [Open-Meteo](https://open-meteo.com) — free, no API key. Just set
`MIRROR_LAT` / `MIRROR_LON` in `.env.local` to your location.

## 4. Run it

```bash
npm run dev     # development, http://localhost:3000
npm run build && npm start   # production
```

## 5. Displaying on the mirror

Once the new driver board is in and the mirror is showing HDMI input from
whatever's running this app (Pi, mini PC, old laptop, etc.):

- Point a browser at `http://localhost:3000` in **kiosk/fullscreen mode**
  (hides the address bar and cursor). On a Raspberry Pi running Chromium:
  ```bash
  chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3000
  ```
- Since the whole point is glass, not a monitor, keep dark backgrounds and
  avoid bright large blocks of color elsewhere in future modules — it breaks
  the mirror effect.
- Set the display to never sleep/blank (`xset s off; xset -dpms` on
  Linux/X11, or the equivalent OS setting) so the mirror stays "on."

## Project structure

```
app/
  page.js              -> main dashboard layout
  api/calendar/route.js -> Google Calendar server route
  api/weather/route.js  -> Open-Meteo server route
components/
  ClockDate.js
  WeatherWidget.js
  CalendarMonth.js
  Placeholder.js        -> stand-in for not-yet-built modules
lib/
  googleAuth.js          -> shared OAuth2 client
scripts/
  get-refresh-token.mjs  -> one-time Google auth script
```

## Adding the next module

Each module is just a component + (if it needs external data) an API route
under `app/api/<name>/route.js` that the component fetches from client-side.
Swap a `<Placeholder label="..." />` in `app/page.js` for the real component
when you build it.
