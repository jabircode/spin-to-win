# sleekflow-spin-to-win

A mobile-first spin-to-win wheel web app built for SleekFlow campaigns. Verifies contacts via the SleekFlow API before allowing a spin, prevents duplicate entries, and is fully rebrandable through config files.

## Demo

```
http://localhost:8080/?contactId=test
```

Use `contactId=test` to bypass API verification during development.

---

## File Structure

```
spin-the-wheel/
├── index.html      # App shell (screens + markup)
├── style.css       # Layout & component styles (rarely needs editing)
├── config.css      # ← Brand colors, fonts, visual tokens
├── config.js       # ← API settings, logo, copy, spin behavior
├── prizes.js       # ← Prize labels, probabilities, segment colors
└── script.js       # Core wheel logic (no editing needed)
```

---

## Configuration

### 1. Prizes — `prizes.js`

```js
const PRIZES = [
  { label: "🎉 Grand Prize",      probability: 2,  color: "#2A42A8" },
  { label: "🎁 Gift Voucher $50", probability: 5,  color: "#4364E0" },
  // add or remove entries freely
];
```

- **label** — text shown on the wheel segment
- **probability** — relative weight (does not need to sum to 100)
- **color** — hex color for the segment

### 2. Theme — `config.css`

```css
:root {
  --sf-primary: #4364E0;      /* main brand color */
  --sf-bg: #F5F6FA;           /* page background */
  --sf-text: #1A1A2E;         /* body text */
  --sf-pointer-color: #1A1A2E; /* wheel pointer */
  /* ... */
}
```

### 3. App settings — `config.js`

```js
const CONFIG = {
  apiBase: "https://api.sleekflow.io/api/contact/",
  apiKey:  "YOUR_API_KEY",

  spinDurationMs: 4000,   // spin animation length
  extraRotations: 5,      // extra full turns for drama

  title:    "Spin to <span class='highlight'>Win!</span>",
  subtitle: "Try your luck and win amazing prizes",
  logo:     `<svg .../>`,  // swap in any inline SVG
};
```

---

## Running Locally

```bash
cd spin-the-wheel
python3 -m http.server 8080
```

Then open: `http://localhost:8080/?contactId=test`

> **Note:** The app must be served over HTTP (not opened as a `file://` URL) for the SleekFlow API call to work correctly.

---

## URL Parameters

| Parameter | Description |
|---|---|
| `contactId=xxx` | SleekFlow contact ID — verified against the API |
| `contactId=test` | Skips API verification (for development/testing) |

If the `contactId` is missing or not found in SleekFlow, the user sees an error screen and cannot spin.

---

## How It Works

1. User opens the URL with their `contactId`
2. App verifies the contact via `GET /api/contact/{id}` with the SleekFlow API key
3. If valid, the wheel is shown — otherwise an error screen is displayed
4. On spin, a winner is picked using weighted random selection
5. The result is shown with a confetti animation
6. The `contactId` is recorded in `localStorage` — revisiting the URL shows an "Already Played" screen

---

## Rebrand for Another Campaign

To adapt this for a different brand, edit only:

- `config.css` — swap colors
- `config.js` — swap logo SVG, API credentials, and copy
- `prizes.js` — update prizes

No changes to `style.css` or `script.js` needed.
# sleekflow-spin-to-win # skip this, README already exists
