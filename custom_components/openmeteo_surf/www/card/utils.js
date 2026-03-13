/**
 * Open-Meteo Surf Card — Utilities
 */

import { localize } from "./i18n.js";

const COMPASS_KEYS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function degToCompass(deg, locale) {
  if (deg == null) return "–";
  const key = COMPASS_KEYS[Math.round(deg / 22.5) % 16];
  return locale ? localize(locale, key) : key;
}

export function fmt(val, unit, locale) {
  if (val == null || val === undefined) return "–";
  if (unit === "°") return `${Math.round(val)}° ${degToCompass(val, locale)}`;
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
