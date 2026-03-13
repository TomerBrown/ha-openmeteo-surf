/**
 * Open-Meteo Surf Card — i18n
 * Imports translations from translations/*.js — add new languages there
 */

import { TRANSLATIONS } from "./translations/index.js";

/** Normalize locale: "en-US" -> "en", "he" -> "he" */
function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") return "en";
  const lang = locale.split("-")[0].toLowerCase();
  return TRANSLATIONS[lang] ? lang : "en";
}

/**
 * Translate a key. Supports {placeholder} substitution.
 * @param {string} locale - e.g. "en", "he", "en-US"
 * @param {string} key - translation key
 * @param {Object} [vars] - optional vars for {key} substitution
 * @returns {string}
 */
export function localize(locale, key, vars = {}) {
  const lang = normalizeLocale(locale);
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return str;
}

/**
 * Get translated param meta for a parameter key.
 * @param {string} locale
 * @param {string} paramKey - e.g. "wave_height"
 * @returns {{ label: string, desc: string }}
 */
export function getParamTranslations(locale, paramKey) {
  const labelMap = {
    wave_height: "param_waves",
    wave_period: "param_period",
    wave_direction: "param_wave_dir",
    swell_wave_height: "param_swell",
    swell_wave_period: "param_swell_per",
    swell_wave_direction: "param_swell_dir",
    sea_surface_temperature: "param_water",
    temperature: "param_air",
    wind_speed: "param_wind",
    wind_direction: "param_wind_dir",
    precipitation: "param_rain",
    wave_height_max: "param_max_waves",
    wave_period_max: "param_max_period",
    wave_direction_dominant: "param_wave_dir",
    swell_wave_height_max: "param_max_swell",
    swell_wave_period_max: "param_max_swell_per",
    temperature_max: "param_max_temp",
    temperature_min: "param_min_temp",
    wind_speed_max: "param_max_wind",
    precipitation_sum: "param_total_rain",
  };
  const descMap = {
    wave_height: "desc_wave_height",
    wave_period: "desc_wave_period",
    wave_direction: "desc_wave_direction",
    swell_wave_height: "desc_swell_height",
    swell_wave_period: "desc_swell_period",
    swell_wave_direction: "desc_swell_direction",
    sea_surface_temperature: "desc_water_temp",
    temperature: "desc_air_temp",
    wind_speed: "desc_wind_speed",
    wind_direction: "desc_wind_direction",
    precipitation: "desc_precipitation",
    wave_height_max: "desc_max_wave_height",
    wave_period_max: "desc_max_period",
    wave_direction_dominant: "desc_wave_direction",
    swell_wave_height_max: "desc_max_swell",
    swell_wave_period_max: "desc_max_swell_period",
    temperature_max: "desc_max_temp",
    temperature_min: "desc_min_temp",
    wind_speed_max: "desc_max_wind",
    precipitation_sum: "desc_total_rain",
  };
  return {
    label: localize(locale, labelMap[paramKey] || paramKey),
    desc: localize(locale, descMap[paramKey] || ""),
  };
}
