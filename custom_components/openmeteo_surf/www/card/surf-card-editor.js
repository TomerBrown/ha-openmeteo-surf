/**
 * Open-Meteo Surf Card — Config editor
 */

import { AVAILABLE_PARAM_KEYS, PARAM_META } from "./constants.js";
import { localize, getParamTranslations } from "./i18n.js";
import { escapeHtml } from "./utils.js";

function escapeAttr(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Config keys that only affect values, not form structure. Skip re-render when only these change. */
const TEXT_ONLY_KEYS = new Set([
  "title", "primary_color", "border_radius",
  "forecast_rows_hourly", "forecast_rows_daily",
  "title_font_size", "title_overflow", "title_font_weight"
]);

function isTextOnlyChange(prev, next) {
  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  for (const k of allKeys) {
    if (TEXT_ONLY_KEYS.has(k)) continue;
    const p = prev?.[k];
    const n = next?.[k];
    if (JSON.stringify(p) !== JSON.stringify(n)) return false;
  }
  return true;
}

export class OpenMeteoSurfCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._debounceTimer = null;
  }

  setConfig(config) {
    const prev = this._config;
    this._config = { ...config };
    if (prev && Object.keys(prev).length > 0 && isTextOnlyChange(prev, this._config)) {
      return;
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    const locale = (this._hass.locale?.language ?? this._hass.locale ?? "en");
    const t = (key, vars) => localize(locale, key, vars);

    const activeEl = document.activeElement;
    const focusState = activeEl?.id && this.shadowRoot.contains(activeEl)
      ? {
          id: activeEl.id,
          value: activeEl.value,
          selectionStart: activeEl.selectionStart,
          selectionEnd: activeEl.selectionEnd,
        }
      : null;

    const entityVal = this._config.entity || "";
    const ftVal = this._config.forecast_type || "both";
    const selectedParams = this._config.show_params || AVAILABLE_PARAM_KEYS;
    const titleVal = this._config.title || "";
    const showRefreshBtn = this._config.show_refresh_button !== false;
    const showRefreshText = this._config.show_refresh_text !== false;
    const displayModeVal = this._config.display_mode || "normal";
    const showHeader = this._config.show_header !== false;
    const showCurrentConditions = this._config.show_current_conditions !== false;
    const showForecastTable = this._config.show_forecast_table !== false;
    const showTabs = this._config.show_tabs !== false;
    const showHeaderLogo = this._config.show_header_logo !== false;
    const forecastRowsHourly = this._config.forecast_rows_hourly ?? "";
    const forecastRowsDaily = this._config.forecast_rows_daily ?? "";
    const primaryColorVal = this._config.primary_color || "";
    const borderRadiusVal = this._config.border_radius ?? "";
    const showWatermark = this._config.show_watermark !== false;
    const tooltipStyleVal = this._config.tooltip_style || "theme";

    const weatherEntities = Object.keys(this._hass.states)
      .filter((eid) => eid.startsWith("weather."))
      .sort();

    const entityOptions = weatherEntities.map((eid) => {
      const stateObj = this._hass.states[eid];
      const name = stateObj.attributes.friendly_name || eid;
      return `<option value="${eid}" ${eid === entityVal ? "selected" : ""}>${name} (${eid})</option>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        .editor { padding: 16px; font-family: var(--ha-card-font-family, system-ui); }
        .editor label { display: block; font-weight: 500; margin: 12px 0 4px; font-size: 0.9em; color: var(--primary-text-color); }
        .editor input, .editor select {
          width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px; font-size: 0.9em; background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
        }
        .editor small { color: var(--secondary-text-color); font-size: 0.78em; }
        .editor-row { margin: 6px 0; }
        .editor-checkbox { display: flex; align-items: center; gap: 8px; font-weight: 400; cursor: pointer; }
        .editor-checkbox input { width: auto; }
        .editor-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--divider-color, #e2e8f0); }
        .editor-section-title { font-weight: 600; font-size: 0.95em; margin-bottom: 12px; color: var(--primary-text-color); }
        .params-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px 16px; }
      </style>
      <div class="editor">
        <label>${escapeHtml(t("entity_label"))}</label>
        <select id="entity">
          <option value="" ${entityVal === "" ? "selected" : ""}>${escapeHtml(t("select_entity"))}</option>
          ${entityOptions}
        </select>

        <label>${escapeHtml(t("title_optional"))}</label>
        <input id="title" value="${escapeAttr(titleVal)}" placeholder="${escapeAttr(t("title_placeholder"))}" />

        <div class="editor-section">
          <div class="editor-section-title">${escapeHtml(t("appearance"))}</div>
          <label>${escapeHtml(t("display_mode"))}</label>
          <select id="display_mode">
            <option value="compact" ${displayModeVal === "compact" ? "selected" : ""}>${escapeHtml(t("compact"))}</option>
            <option value="normal" ${displayModeVal === "normal" ? "selected" : ""}>${escapeHtml(t("normal"))}</option>
            <option value="elaborated" ${displayModeVal === "elaborated" ? "selected" : ""}>${escapeHtml(t("elaborated"))}</option>
          </select>
          <small>${escapeHtml(t("display_mode_hint"))}</small>

          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_header" ${showHeader ? "checked" : ""} />
              ${escapeHtml(t("show_header"))}
            </label>
          </div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_header_logo" ${showHeaderLogo ? "checked" : ""} />
              ${escapeHtml(t("show_logo"))}
            </label>
          </div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_watermark" ${showWatermark ? "checked" : ""} />
              ${escapeHtml(t("show_watermark"))}
            </label>
          </div>

          <label>${escapeHtml(t("primary_color"))}</label>
          <input id="primary_color" value="${escapeAttr(primaryColorVal)}" placeholder="${escapeAttr(t("primary_color_placeholder"))}" />

          <label>${escapeHtml(t("border_radius"))}</label>
          <input id="border_radius" value="${escapeAttr(String(borderRadiusVal))}" placeholder="${escapeAttr(t("border_radius_placeholder"))}" />

          <label>${escapeHtml(t("tooltip_style"))}</label>
          <select id="tooltip_style">
            <option value="theme" ${tooltipStyleVal === "theme" ? "selected" : ""}>${escapeHtml(t("match_theme"))}</option>
            <option value="dark" ${tooltipStyleVal === "dark" ? "selected" : ""}>${escapeHtml(t("dark"))}</option>
          </select>
        </div>

        <div class="editor-section">
          <div class="editor-section-title">${escapeHtml(t("content"))}</div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_current_conditions" ${showCurrentConditions ? "checked" : ""} />
              ${escapeHtml(t("show_current_conditions"))}
            </label>
          </div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_forecast_table" ${showForecastTable ? "checked" : ""} />
              ${escapeHtml(t("show_forecast_table"))}
            </label>
          </div>

          <label>${escapeHtml(t("forecast_type"))}</label>
          <select id="forecast_type">
            <option value="both"   ${ftVal === "both" ? "selected" : ""}>${escapeHtml(t("both_forecast"))}</option>
            <option value="hourly" ${ftVal === "hourly" ? "selected" : ""}>${escapeHtml(t("hourly_only"))}</option>
            <option value="daily"  ${ftVal === "daily" ? "selected" : ""}>${escapeHtml(t("daily_only"))}</option>
          </select>

          <label>${escapeHtml(t("hourly_rows"))}</label>
          <input type="number" id="forecast_rows_hourly" value="${escapeAttr(String(forecastRowsHourly))}" placeholder="24" min="1" max="48" />

          <label>${escapeHtml(t("daily_rows"))}</label>
          <input type="number" id="forecast_rows_daily" value="${escapeAttr(String(forecastRowsDaily))}" placeholder="7" min="1" max="14" />

          ${ftVal === "both" && showForecastTable ? `
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_tabs" ${showTabs ? "checked" : ""} />
              ${escapeHtml(t("show_tabs"))}
            </label>
          </div>
          ` : ""}

          <label>${escapeHtml(t("show_parameters"))}</label>
          <div class="params-grid">
            ${AVAILABLE_PARAM_KEYS.map((key) => {
              const meta = PARAM_META[key] || { label: key, icon: "" };
              const tr = getParamTranslations(locale, key);
              const label = tr.label || meta.label;
              const checked = selectedParams.includes(key);
              return `
              <label class="editor-checkbox">
                <input type="checkbox" class="param-cb" data-param="${escapeAttr(key)}" ${checked ? "checked" : ""} />
                ${meta.icon || ""} ${escapeAttr(label)}
              </label>`;
            }).join("")}
          </div>
        </div>

        <div class="editor-section">
          <div class="editor-section-title">${escapeHtml(t("refresh_section"))}</div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_refresh_button" ${showRefreshBtn ? "checked" : ""} />
              ${escapeHtml(t("show_refresh_button"))}
            </label>
          </div>
          <div class="editor-row">
            <label class="editor-checkbox">
              <input type="checkbox" id="show_refresh_text" ${showRefreshText ? "checked" : ""} />
              ${escapeHtml(t("show_refresh_text"))}
            </label>
          </div>
        </div>
      </div>
    `;

    const controlIds = [
      "entity", "title", "display_mode", "show_header", "show_header_logo", "show_watermark",
      "primary_color", "border_radius", "tooltip_style",
      "show_current_conditions", "show_forecast_table", "forecast_type", "forecast_rows_hourly", "forecast_rows_daily",
      "show_refresh_button", "show_refresh_text"
    ];
    if (ftVal === "both" && showForecastTable) controlIds.push("show_tabs");

    controlIds.forEach((id) => {
      const el = this.shadowRoot.getElementById(id);
      if (el) {
        el.addEventListener("change", (e) => this._onChange(e));
        if (el.tagName === "INPUT" && el.type !== "checkbox") {
          el.addEventListener("input", () => this._onChangeDebounced());
          el.addEventListener("blur", () => this._flushDebounce());
        }
      }
    });

    this.shadowRoot.querySelectorAll(".param-cb").forEach((cb) => {
      cb.addEventListener("change", (e) => this._onChange(e));
    });

    if (focusState) {
      const el = this.shadowRoot.getElementById(focusState.id);
      if (el) {
        el.value = focusState.value;
        el.focus();
        if (typeof el.setSelectionRange === "function" && typeof focusState.selectionStart === "number") {
          el.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
        }
      }
    }
  }

  _onChangeDebounced() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this._onChange();
    }, 300);
  }

  _flushDebounce() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
      this._onChange();
    }
  }

  _onChange(e) {
    const get = (id) => this.shadowRoot.getElementById(id);
    const prevForecastType = this._config.forecast_type;
    const prevShowForecastTable = this._config.show_forecast_table;

    const entity = get("entity")?.value?.trim() ?? "";
    const title = get("title")?.value?.trim() ?? "";
    const display_mode = get("display_mode")?.value ?? "normal";
    const show_header = get("show_header")?.checked !== false;
    const show_header_logo = get("show_header_logo")?.checked !== false;
    const show_watermark = get("show_watermark")?.checked !== false;
    const primary_color = get("primary_color")?.value?.trim() || null;
    const border_radius_raw = get("border_radius")?.value?.trim();
    const border_radius = border_radius_raw
      ? (border_radius_raw.match(/^\d+$/) ? Number(border_radius_raw) : border_radius_raw)
      : null;
    const tooltip_style = get("tooltip_style")?.value ?? "theme";
    const show_current_conditions = get("show_current_conditions")?.checked !== false;
    const show_forecast_table = get("show_forecast_table")?.checked !== false;
    const forecast_type = get("forecast_type")?.value ?? "both";
    const forecast_rows_hourly_raw = get("forecast_rows_hourly")?.value?.trim();
    const forecast_rows_hourly = forecast_rows_hourly_raw ? parseInt(forecast_rows_hourly_raw, 10) : null;
    const forecast_rows_daily_raw = get("forecast_rows_daily")?.value?.trim();
    const forecast_rows_daily = forecast_rows_daily_raw ? parseInt(forecast_rows_daily_raw, 10) : null;
    const show_tabs = get("show_tabs")?.checked !== false;

    const show_params = Array.from(this.shadowRoot.querySelectorAll(".param-cb:checked"))
      .map((cb) => cb.dataset.param)
      .filter(Boolean);
    const show_params_final = show_params.length > 0 ? show_params : AVAILABLE_PARAM_KEYS;

    const show_refresh_button = get("show_refresh_button")?.checked !== false;
    const show_refresh_text = get("show_refresh_text")?.checked !== false;

    this._config = {
      ...this._config,
      entity,
      forecast_type,
      show_params: show_params_final,
      show_refresh_button,
      show_refresh_text,
      display_mode,
      show_header,
      show_header_logo,
      show_watermark,
      primary_color,
      border_radius,
      tooltip_style,
      show_current_conditions,
      show_forecast_table,
      forecast_rows_hourly: isNaN(forecast_rows_hourly) ? null : forecast_rows_hourly,
      forecast_rows_daily: isNaN(forecast_rows_daily) ? null : forecast_rows_daily,
      show_tabs,
    };
    if (title) this._config.title = title;
    else delete this._config.title;
    if (!primary_color) delete this._config.primary_color;
    if (border_radius == null || border_radius === "") delete this._config.border_radius;
    if (forecast_rows_hourly == null) delete this._config.forecast_rows_hourly;
    if (forecast_rows_daily == null) delete this._config.forecast_rows_daily;

    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));

    const formStructureChanged = prevForecastType !== forecast_type || prevShowForecastTable !== show_forecast_table;
    if (formStructureChanged) {
      this._render();
    }
  }
}
