/**
 * Open-Meteo Surf Card — Config editor
 */

import { DEFAULT_SHOW_PARAMS } from "./constants.js";

function escapeAttr(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export class OpenMeteoSurfCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

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
    const paramsVal = (this._config.show_params || DEFAULT_SHOW_PARAMS).join(", ");
    const titleVal = this._config.title || "";
    const showRefreshBtn = this._config.show_refresh_button !== false;
    const showRefreshText = this._config.show_refresh_text !== false;
    const displayModeVal = this._config.display_mode || "normal";

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
      </style>
      <div class="editor">
        <label>Entity (weather.*)</label>
        <select id="entity">
          <option value="" ${entityVal === "" ? "selected" : ""}>Select a weather entity</option>
          ${entityOptions}
        </select>

        <label>Title (optional)</label>
        <input id="title" value="${escapeAttr(titleVal)}" placeholder="Auto from entity name" />

        <label>Display mode</label>
        <select id="display_mode">
          <option value="compact" ${displayModeVal === "compact" ? "selected" : ""}>Compact</option>
          <option value="normal" ${displayModeVal === "normal" ? "selected" : ""}>Normal</option>
          <option value="elaborated" ${displayModeVal === "elaborated" ? "selected" : ""}>Elaborated</option>
        </select>
        <small>Compact: smaller, fewer stats. Elaborated: larger, more spacing.</small>

        <label>Forecast type</label>
        <select id="forecast_type">
          <option value="both"   ${ftVal === "both" ? "selected" : ""}>Both (hourly + daily)</option>
          <option value="hourly" ${ftVal === "hourly" ? "selected" : ""}>Hourly only</option>
          <option value="daily"  ${ftVal === "daily" ? "selected" : ""}>Daily only</option>
        </select>

        <label>Show parameters</label>
        <input id="show_params" value="${escapeAttr(paramsVal)}" />
        <small>Comma-separated: wave_height, wave_period, wave_direction, swell_wave_height, wind_speed, wind_direction, temperature, precipitation, sea_surface_temperature</small>

        <label style="margin-top: 16px;">Refresh button</label>
        <div class="editor-row">
          <label class="editor-checkbox">
            <input type="checkbox" id="show_refresh_button" ${showRefreshBtn ? "checked" : ""} />
            Show refresh button
          </label>
        </div>
        <div class="editor-row">
          <label class="editor-checkbox">
            <input type="checkbox" id="show_refresh_text" ${showRefreshText ? "checked" : ""} />
            Show "Refresh" text on button
          </label>
        </div>
      </div>
    `;

    ["entity", "title", "display_mode", "forecast_type", "show_params", "show_refresh_button", "show_refresh_text"].forEach((id) => {
      const el = this.shadowRoot.getElementById(id);
      if (el) {
        el.addEventListener("change", () => this._onChange());
        if (el.tagName === "INPUT") {
          el.addEventListener("input", () => this._onChange());
        }
      }
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

  _onChange() {
    const entity = this.shadowRoot.getElementById("entity")?.value?.trim() ?? "";
    const title = this.shadowRoot.getElementById("title")?.value?.trim() ?? "";
    const display_mode = this.shadowRoot.getElementById("display_mode")?.value ?? "normal";
    const ft = this.shadowRoot.getElementById("forecast_type")?.value ?? "both";
    const paramsRaw = this.shadowRoot.getElementById("show_params")?.value ?? "";
    const show_params = paramsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const show_refresh_button = this.shadowRoot.getElementById("show_refresh_button")?.checked !== false;
    const show_refresh_text = this.shadowRoot.getElementById("show_refresh_text")?.checked !== false;

    this._config = { ...this._config, entity, forecast_type: ft, show_params, show_refresh_button, show_refresh_text, display_mode };
    if (title) this._config.title = title;
    else delete this._config.title;

    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }
}
