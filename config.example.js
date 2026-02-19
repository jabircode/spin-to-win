/**
 * App Configuration — EXAMPLE
 * ----------------------------
 * Copy this file to config.js and fill in your real values.
 * config.js is gitignored and should NEVER be committed.
 *
 *   cp config.example.js config.js
 */

const CONFIG = {
  // ── API ──
  apiBase: "https://api.sleekflow.io/api/contact/",
  apiKey: "YOUR_SLEEKFLOW_API_KEY",

  // ── Wheel behavior ──
  spinDurationMs: 4000,
  extraRotations: 5, // full extra spins for dramatic effect
  allowMultipleSpins: false, // if true, users can spin multiple times (no localStorage check)

  // ── Branding ──
  title: "Spin to <span class='highlight'>Win!</span>",
  subtitle: "Try your luck and win amazing prizes",
  resultHeading: "🎉 Congratulations!",
  resultNote: "We'll be in touch with your reward details.",
  alreadyPlayedMessage: "You've already spun the wheel! Stay tuned for your prize.",
  noContactMessage: "Please use the link provided to you.",

  // ── Logo (inline SVG string) ──
  logo: `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="16" viewBox="0 0 3000 460.8" xml:space="preserve" class="logo-svg"><path fill="currentColor" d="m230.6 380 27.5-35.5c21.7 22.3 52.6 36.6 90.4 36.6 38.3 0 67.5-14.9 67.5-41.2 0-28-32.6-36.6-71-45.8-48.1-12-104.7-26.9-104.7-88.1 0-56.7 51.5-85.8 111.6-85.8 46.3 0 82.4 17.7 107 40.1l-27.5 36.1c-19.4-18.9-46.9-31.5-79-31.5-33.8 0-61.8 13.2-61.8 38.3 0 28.6 33.2 36.6 72.1 45.8 48.1 11.4 104.2 25.8 104.2 86.4 0 57.8-52.1 90.4-117.9 90.4-51.4 0-91.5-20.1-118.4-45.8zM932.8 294.7H681.6c9.7 50.9 51.5 85.8 108.2 85.8 42.9 0 79.5-20.6 98.4-47.5l33.8 29.2c-29.2 38.9-77.3 63.5-133.9 63.5-91.6 0-159.7-66.4-159.7-153.9 0-86.4 65.8-151.6 153.4-151.6 87 0 152.2 65.2 152.2 152.8-.1 6.8-.7 14.8-1.2 21.7zm-249.5-44.6h200.9c-9.2-50.4-49.2-84.7-100.7-84.7-51 0-91.1 34.9-100.2 84.7zM1279 294.7h-251.2c9.7 50.9 51.5 85.8 108.2 85.8 42.9 0 79.5-20.6 98.4-47.5l33.8 29.2c-29.2 38.9-77.3 63.5-133.9 63.5-91.6 0-159.7-66.4-159.7-153.9 0-86.4 65.8-151.6 153.4-151.6 87 0 152.2 65.2 152.2 152.8 0 6.8-.6 14.8-1.2 21.7zm-251.8-44.6h200.9c-9.2-50.4-49.2-84.7-100.7-84.7-51 0-91 34.9-100.2 84.7zM1423.2 301.7l-37.8 40.1V419h-49.2V25.6l49.2-17v266.8L1525 127.2h64.1L1458 265.1 1593.2 419H1528l-104.8-117.3zM1754.6 0c20.6 0 34.9 4 50.4 12v43.5c-12-6.3-24-10.3-40.1-10.3-29.8 0-46.9 13.2-46.9 44.6V127h84.1v44.6H1718v247.2h-49.2V171.7h-53.2V127h53.2V86.4c-.1-54.9 29.1-86.4 85.8-86.4zM1907.4 6.9v412h-49.2v-395zM572.3 6.9v412H523v-395z"></path><path fill="#4b9be8" d="M0 376.6h174.5v49.2H0z"></path><path fill="currentColor" d="M1963.4 273c0-87 67-152.8 155.7-152.8 88.1 0 155.1 65.8 155.1 152.8 0 87-67 152.8-155.1 152.8-88.7 0-155.7-65.9-155.7-152.8zm259.8 0c0-60.1-44.6-105.3-104.1-105.3-60.1 0-104.7 45.2-104.7 105.3s44.6 105.3 104.7 105.3c59.5 0 104.1-45.2 104.1-105.3zM2774.9 127l-107 291.9h-51.5l-80.7-233.5-80.7 233.5h-51.5l-107-291.9h55.5l79 231.8 80.1-231.8h50.4l80.7 232.3 79-232.3h53.7z"></path><path fill="#4b9be8" d="M2815.4 0h174.5v174.5L2815.4 0"></path></svg>`,

  // ── Webhook ──
  // Set url to null to disable. The payload below is sent as JSON via POST.
  webhook: {
    url: null, // e.g. "https://hooks.zapier.com/hooks/catch/xxxxx/yyyyy/"

    // Customize the payload shape here. Values are resolved at spin time.
    // Available tokens: contactId, prize (label string), prizeIndex, timestamp (UTC ISO string)
    // Set any field to null to omit it from the payload.
    payload: {
      contactId:  "{{contactId}}",
      prize:      "{{prize}}",
      prizeIndex: "{{prizeIndex}}",
      timestamp:  "{{timestamp}}",   // UTC+0 ISO 8601, e.g. "2025-01-31T08:45:00.000Z"
      source:     "spin-to-win",     // static value — change or remove as needed
    },
  },

  // ── Confetti colors ──
  confettiColors: ["#4364E0", "#6B8AFF", "#EEF1FD", "#3350C4", "#FFD700", "#FF6B6B", "#4ADE80"],

  // ── Wheel canvas styling ──
  wheelCenterFill: "#FFFFFF",
  wheelCenterStroke: "#4364E0",
  wheelLabelColor: "#FFFFFF",
};
