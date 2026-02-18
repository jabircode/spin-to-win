# sleekflow-spin-to-win

A mobile-first spin-to-win wheel web app built for SleekFlow campaigns. Verifies contacts via the SleekFlow API before allowing a spin, prevents duplicate entries, fires a webhook on result, and is fully rebrandable through config files.

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
├── config.js       # ← API settings, webhook, logo, copy, spin behavior
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
  --sf-primary: #4364E0;       /* main brand color */
  --sf-bg: #F5F6FA;            /* page background */
  --sf-text: #1A1A2E;          /* body text */
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

### 4. Webhook — `config.js`

A POST request is fired automatically after every spin. Configure it in the `webhook` block inside `config.js`:

```js
webhook: {
  url: "https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/", // set to null to disable

  payload: {
    contactId:  "{{contactId}}",  // SleekFlow contact ID from URL param
    prize:      "{{prize}}",      // winning prize label, e.g. "🎁 Gift Voucher $50"
    prizeIndex: "{{prizeIndex}}", // zero-based index into PRIZES array
    timestamp:  "{{timestamp}}", // UTC ISO 8601, e.g. "2025-01-31T08:45:00.000Z"
    source:     "spin-to-win",   // static value — edit or remove as needed
  },
},
```

**Available tokens** (use inside any string value in `payload`):

| Token | Value |
|---|---|
| `{{contactId}}` | Contact ID from the URL |
| `{{prize}}` | Winning prize label |
| `{{prizeIndex}}` | Index of the winning prize (0-based) |
| `{{timestamp}}` | Spin time in UTC ISO 8601 format |

**Notes:**
- Set `url: null` to disable the webhook entirely
- Set any payload field to `null` to omit it from the request body
- Non-token string values (like `source: "spin-to-win"`) are passed through as-is
- The webhook fires for `contactId=test` as well — useful for end-to-end testing

---

## Running Locally

```bash
cd spin-the-wheel
python3 -m http.server 8080
```

Then open: `http://localhost:8080/?contactId=test`

> **Note:** The app must be served over HTTP (not opened as a `file://` URL) for the SleekFlow API and webhook calls to work correctly.

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
6. A POST webhook is fired with the prize result, contact ID, and timestamp
7. The `contactId` is recorded in `localStorage` — revisiting the URL shows an "Already Played" screen

---

## Rebrand for Another Campaign

To adapt this for a different brand, edit only:

- `config.css` — swap colors
- `config.js` — swap logo SVG, API credentials, webhook URL, and copy
- `prizes.js` — update prizes

No changes to `style.css` or `script.js` needed.
