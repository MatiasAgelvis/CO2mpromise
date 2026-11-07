// Small shared number formatters so every panel speaks the same language.

const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];

export function num(n, dp = 2) {
  if (!Number.isFinite(n)) return "∞";
  const neg = n < 0;
  n = Math.abs(n);
  let tier = 0;
  while (n >= 1000 && tier < UNITS.length - 1) {
    n /= 1000;
    tier++;
  }
  let s;
  if (n >= 100) s = n.toFixed(0);
  else if (n >= 10) s = n.toFixed(1);
  else s = n.toFixed(dp);
  // Keep three significant digits up the suffix ladder so the HUD doesn't
  // change width as values tick over; trim only plain numbers (1.00 -> 1).
  if (tier === 0) s = s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return (neg ? "−" : "") + s + UNITS[tier];
}

export const money = (n) => "$" + num(n);
export const rate = (n) => "$" + num(n) + "/s";
export const price = (n) => "$" + n.toFixed(2) + "/kWh";
export const kg = (n) => num(n) + " kg";
export const kwh = (n) => num(n) + " kWh/s";
export const pct = (n) => Math.round(n * 100) + "%";

export function secs(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export function sign(n, digits = 1) {
  const v = Number(n) || 0;
  if (Math.abs(v) < 0.05) return "±0";
  return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(digits);
}
