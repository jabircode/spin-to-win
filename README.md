# sleekflow-spin-to-win

A mobile-first spin-to-win wheel web app built for SleekFlow campaigns. Verifies contacts via the SleekFlow API before allowing a spin, supports multiple spins with chance tracking, includes automatic failover across multiple API regions, fires a webhook on result, and is fully rebrandable through config files.

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
  // Multiple base URLs for automatic failover
  baseUrls: [
    "https://api.sleekflow.io",
    "https://sleekflow-core-app-eus-production.azurewebsites.net",
    "https://sleekflow-core-app-seas-production.azurewebsites.net",
    "https://sleekflow-core-app-weu-production.azurewebsites.net",
    "https://sleekflow-core-app-uaen-production.azurewebsites.net",
  ],
  endpoints: {
    contact: "/api/contact/",
    customObjects: "/api/customObjects/spin_to_win/records/",
  },
  apiKey: "YOUR_API_KEY",

  spinDurationMs: 4000,        // spin animation length
  extraRotations: 5,           // extra full turns for drama
  allowMultipleSpins: false,   // enable multiple spins with chance tracking
  numberOfChances: 3,          // max spins per user (when allowMultipleSpins is true)

  title:    "Spin to <span class='highlight'>Win!</span>",
  subtitle: "Try your luck and win amazing prizes",
  logo:     `<svg .../>`,      // swap in any inline SVG
};
```

**Multiple Base URLs & Failover:**
The app automatically tries each base URL in order until one responds successfully, then caches that URL for the entire session. This ensures the app works even if one region is down.

**Multiple Spins:**
- Set `allowMultipleSpins: true` to enable chance tracking
- Configure `numberOfChances` to set how many times each user can spin
- The app tracks spins using SleekFlow Custom Objects API
- Users see remaining chances displayed on the spin button

### 4. Webhook — `config.js`

A POST request is fired automatically after every spin. Configure it in the `webhook` block inside `config.js`:

```js
webhook: {
  url: "https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/", // set to null to disable

  payload: {
    contactId:    "{{contactId}}",    // SleekFlow contact ID from URL param
    prize:        "{{prize}}",        // winning prize label, e.g. "🎁 Gift Voucher $50"
    prizeIndex:   "{{prizeIndex}}",   // zero-based index into PRIZES array
    timestamp:    "{{timestamp}}",    // UTC ISO 8601, e.g. "2025-01-31T08:45:00.000Z"
    chanceNumber: "{{chanceNumber}}", // which attempt this was (only with allowMultipleSpins)
    source:       "spin-to-win",      // static value — edit or remove as needed
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
| `{{chanceNumber}}` | Which spin attempt (1, 2, 3, etc.) - only relevant when `allowMultipleSpins` is enabled |

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

## Deployment

### Automated Deployment to Cloud Run

The repository includes a GitHub Actions workflow that automatically deploys to Google Cloud Run on every push to `main` or `master`.

**Setup:**

1. **Create GitHub Secrets** (in your repository settings):
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: Service account JSON key with Cloud Run and Container Registry permissions

2. **Push to main/master branch:**
   ```bash
   git add .
   git commit -m "Deploy to Cloud Run"
   git push origin main
   ```

3. **Monitor deployment:**
   - Go to GitHub Actions tab to see deployment progress
   - Once complete, your app will be live at: `https://sleekflow-spin-to-win-327054350441.asia-southeast1.run.app`

**Manual deployment via gcloud CLI:**

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sleekflow-spin-to-win

# Deploy to Cloud Run
gcloud run deploy sleekflow-spin-to-win \
  --image gcr.io/YOUR_PROJECT_ID/sleekflow-spin-to-win \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## URL Parameters

| Parameter | Description |
|---|---|
| `contactId=xxx` | SleekFlow contact ID — verified against the API |
| `contactId=test` | Skips API verification (for development/testing) |

If the `contactId` is missing or not found in SleekFlow, the user sees an error screen and cannot spin.

---

## How It Works

### Standard Mode (Single Spin)

1. User opens the URL with their `contactId`
2. App tries each base URL until finding a working SleekFlow API endpoint
3. App verifies the contact via `GET /api/contact/{id}` with the SleekFlow API key
4. If valid, the wheel is shown — otherwise an error screen is displayed
5. On spin, a winner is picked using weighted random selection
6. The result is shown with a confetti animation
7. A POST webhook is fired with the prize result, contact ID, and timestamp
8. The `contactId` is recorded in `localStorage` — revisiting the URL shows an "Already Played" screen

### Multiple Spins Mode (`allowMultipleSpins: true`)

1. User opens the URL with their `contactId`
2. App finds a working API endpoint using the failover mechanism
3. App verifies the contact via `GET /api/contact/{id}`
4. App checks remaining chances via `GET /api/customObjects/spin_to_win/records/spinToWin-{contactId}-{N}`
   - Checks from max chance down to 1 to find the highest used chance
   - If user has used all chances, shows "Already Played" screen
   - Otherwise, displays remaining chances on the spin button
5. On spin, a winner is picked using weighted random selection
6. The result is shown with a confetti animation
7. The spin is recorded to Custom Objects API: `POST /api/customObjects/spin_to_win/records/spinToWin-{contactId}-{chanceNumber}`
8. A POST webhook is fired with the prize result, contact ID, chance number, and timestamp
9. User can spin again until all chances are used

---

## Rebrand for Another Campaign

To adapt this for a different brand, edit only:

- `config.css` — swap colors
- `config.js` — swap logo SVG, API credentials, webhook URL, and copy
- `prizes.js` — update prizes

No changes to `style.css` or `script.js` needed.
