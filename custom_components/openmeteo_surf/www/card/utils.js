/**
 * Open-Meteo Surf Card — Utilities
 */

export function degToCompass(deg) {
  if (deg == null) return "–";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function fmt(val, unit) {
  if (val == null || val === undefined) return "–";
  if (unit === "°") return `${Math.round(val)}° ${degToCompass(val)}`;
  if (typeof val === "number") return Number.isInteger(val) ? val : val.toFixed(1);
  return val;
}

export function escapeTitle(s) {
  if (!s) return "";
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
