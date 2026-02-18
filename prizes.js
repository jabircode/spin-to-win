/**
 * Prize Configuration
 * -------------------
 * Edit this file to change prizes and their probabilities.
 *
 * Format: { label, probability, color }
 *   - label:       Display name on the wheel
 *   - probability: Weight (higher = more likely). Does NOT need to sum to 100.
 *   - color:       Segment color (hex). Optional – defaults are provided.
 *
 * Example: a prize with probability 5 among total weight 100 → 5% chance.
 */

const PRIZES = [
  { label: "🎉 Grand Prize",      probability: 2,  color: "#2A42A8" },
  { label: "🎁 Gift Voucher $50", probability: 5,  color: "#4364E0" },
  { label: "🎁 Gift Voucher $20", probability: 10, color: "#5B7BFF" },
  { label: "🏷️ 20% Off",          probability: 15, color: "#3350C4" },
  { label: "🏷️ 10% Off",          probability: 25, color: "#4364E0" },
  { label: "🎲 Try Again",        probability: 20, color: "#2A42A8" },
  { label: "🏷️ 5% Off",           probability: 23, color: "#5B7BFF" },
];
