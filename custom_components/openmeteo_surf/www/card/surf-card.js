/**
 * Open-Meteo Surf Card — Main card component
 */

import {
  PARAM_META,
  HOURLY_KEY_MAP,
  DAILY_KEY_MAP,
  CONDITION_ICONS,
  DEFAULT_SHOW_PARAMS,
} from "./constants.js";
import { degToCompass, fmt, escapeTitle, escapeHtml } from "./utils.js";
import { getStyles } from "./styles.js";

export class OpenMeteoSurfCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._forecasts = { hourly: null, daily: null };
    this._activeTab = null;
    this._unsubHourly = null;
    this._unsubDaily = null;
    this._refreshing = false;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an 'entity' (weather entity ID)");
    this._config = {
      entity: config.entity,
      forecast_type: config.forecast_type || "both",
      show_params: config.show_params || DEFAULT_SHOW_PARAMS,
      title: config.title || null,
      show_refresh_button: config.show_refresh_button !== false,
      show_refresh_text: config.show_refresh_text !== false,
      display_mode: config.display_mode || "normal",
    };
    this._activeTab = this._config.forecast_type === "daily" ? "daily" : "hourly";
  }

  set hass(hass) {
    this._hass = hass;
    this._subscribeForecasts();
    this._render();
  }

  connectedCallback() {
    this._subscribeForecasts();
  }

  disconnectedCallback() {
    this._unsubscribeForecasts();
  }

  async _subscribeForecasts() {
    if (!this._hass || !this._config.entity) return;

    const ft = this._config.forecast_type;

    if ((ft === "hourly" || ft === "both") && !this._unsubHourly) {
      try {
        this._unsubHourly = await this._hass.connection.subscribeMessage(
          (msg) => { this._forecasts.hourly = msg.forecast; this._render(); },
          { type: "weather/subscribe_forecast", forecast_type: "hourly", entity_id: this._config.entity }
        );
      } catch (e) { console.warn("OpenMeteoSurfCard: hourly subscribe failed", e); }
    }

    if ((ft === "daily" || ft === "both") && !this._unsubDaily) {
      try {
        this._unsubDaily = await this._hass.connection.subscribeMessage(
          (msg) => { this._forecasts.daily = msg.forecast; this._render(); },
          { type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: this._config.entity }
        );
      } catch (e) { console.warn("OpenMeteoSurfCard: daily subscribe failed", e); }
    }
  }

  _unsubscribeForecasts() {
    if (this._unsubHourly) { this._unsubHourly(); this._unsubHourly = null; }
    if (this._unsubDaily) { this._unsubDaily(); this._unsubDaily = null; }
  }

  getCardSize() { return 6; }

  static getStubConfig() {
    return {
      entity: "",
      forecast_type: "both",
      show_params: DEFAULT_SHOW_PARAMS,
      show_refresh_button: true,
      show_refresh_text: true,
      display_mode: "normal",
    };
  }

  static getConfigElement() {
    return document.createElement("openmeteo-surf-card-editor");
  }

  _render() {
    if (!this._hass || !this._config.entity) return;
    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding:16px">Entity not found: ${escapeHtml(this._config.entity)}</div></ha-card>`;
      return;
    }
    const attrs = stateObj.attributes;
    const title = this._config.title || attrs.friendly_name || "Surf Forecast";
    const condIcon = CONDITION_ICONS[stateObj.state] || "🌊";
    const displayMode = this._config.display_mode || "normal";

    this.shadowRoot.innerHTML = `
      <style>${getStyles(displayMode)}</style>
      <div id="surf-tooltip" class="surf-tooltip"></div>
      <ha-card data-display-mode="${displayMode}">
        <div class="card-header">
          <img src="/openmeteo_surf/icon.png" class="header-logo" />
          <span class="title" title="${escapeTitle(title)}">${condIcon} ${escapeHtml(title)}</span>
          ${this._config.show_refresh_button ? `
          <button
            class="refresh-btn ${this._config.show_refresh_text ? "with-text" : ""}"
            id="refresh-btn"
            title="Refresh data"
            ${this._refreshing ? "disabled" : ""}
          >
            <span class="refresh-icon ${this._refreshing ? "spinning" : ""}">🔄</span>
            ${this._config.show_refresh_text ? '<span class="refresh-label">Refresh</span>' : ""}
          </button>
          ` : ""}
        </div>
        <div class="card-content">
          ${this._renderCurrent(stateObj, attrs)}
          ${this._renderTabs()}
          ${this._renderForecastTable()}
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._activeTab = btn.dataset.tab;
        this._render();
      });
    });

    const refreshBtn = this.shadowRoot.getElementById("refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this._refresh());
    }

    this._bindTooltips();
  }

  _bindTooltips() {
    const tooltipEl = this.shadowRoot.getElementById("surf-tooltip");
    if (!tooltipEl) return;

    this.shadowRoot.querySelectorAll("[data-tooltip]").forEach((el) => {
      el.addEventListener("mouseenter", (e) => this._showTooltip(e, tooltipEl));
      el.addEventListener("mouseleave", () => this._hideTooltip(tooltipEl));
      el.addEventListener("mousemove", (e) => this._moveTooltip(e, tooltipEl));
    });
  }

  _showTooltip(e, tooltipEl) {
    const text = e.currentTarget.getAttribute("data-tooltip");
    if (!text) return;
    tooltipEl.textContent = text;
    tooltipEl.classList.add("visible");
    this._moveTooltip(e, tooltipEl);
  }

  _hideTooltip(tooltipEl) {
    tooltipEl.classList.remove("visible");
  }

  _moveTooltip(e, tooltipEl) {
    const x = e.clientX;
    const y = e.clientY;
    const pad = 12;
    tooltipEl.style.left = `${x + pad}px`;
    tooltipEl.style.top = `${y + pad}px`;
  }

  async _refresh() {
    if (this._refreshing || !this._hass || !this._config.entity) return;
    this._refreshing = true;
    this._render();
    try {
      await this._hass.callService("homeassistant", "update_entity", {
        entity_id: this._config.entity,
      });
    } finally {
      this._refreshing = false;
      this._render();
    }
  }

  _renderCurrent(stateObj, attrs) {
    const temp = attrs.temperature != null ? `${attrs.temperature}°` : "–";
    const wind = attrs.wind_speed != null ? `${attrs.wind_speed} kt` : "–";
    const waveH = attrs.wave_height != null ? `${attrs.wave_height} m` : "–";
    const swellH = attrs.swell_wave_height != null ? `${attrs.swell_wave_height} m` : "–";
    const wavePer = attrs.wave_period != null ? `${attrs.wave_period}s` : "–";
    const waveDir = attrs.wave_direction != null ? `${Math.round(attrs.wave_direction)}° ${degToCompass(attrs.wave_direction)}` : "–";
    const waterTemp = attrs.sea_surface_temperature != null ? `${attrs.sea_surface_temperature}°C` : "–";
    const windDir = attrs.wind_bearing != null ? degToCompass(attrs.wind_bearing) : "–";

    const isCompact = this._config.display_mode === "compact";

    const stats = [
      { icon: "🌊", value: waveH, label: "Wave Height", primary: true },
      { icon: "⏱️", value: wavePer, label: "Period" },
      { icon: "🧭", value: waveDir, label: "Wave Dir" },
      { icon: "🌊", value: swellH, label: "Swell" },
      { icon: "💨", value: `${wind} ${windDir}`, label: "Wind" },
      { icon: "🌡️", value: `${temp} / ${waterTemp}`, label: "Air / Water" },
    ];

    const displayStats = isCompact
      ? [stats[0], stats[1], stats[4], stats[5]]
      : stats;

    return `
      <div class="current-grid">
        ${displayStats.map((s) => `
        <div class="stat-card ${s.primary ? "primary" : ""}">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value" title="${escapeTitle(s.value)}">${escapeHtml(s.value)}</div>
          <div class="stat-label${!s.primary && isCompact ? " hide-in-compact" : ""}">${escapeHtml(s.label)}</div>
        </div>
        `).join("")}
      </div>
    `;
  }

  _renderTabs() {
    const ft = this._config.forecast_type;
    if (ft !== "both") return "";
    return `
      <div class="tab-bar">
        <button class="tab-btn ${this._activeTab === "hourly" ? "active" : ""}" data-tab="hourly">⏰ Hourly</button>
        <button class="tab-btn ${this._activeTab === "daily" ? "active" : ""}" data-tab="daily">📅 Daily</button>
      </div>
    `;
  }

  _renderForecastTable() {
    const tab = this._activeTab || "hourly";
    const data = this._forecasts[tab];

    if (!data || data.length === 0) {
      return `<div class="no-data">Loading ${tab} forecast…</div>`;
    }

    const isHourly = tab === "hourly";
    const keyMap = isHourly ? HOURLY_KEY_MAP : DAILY_KEY_MAP;
    const params = this._config.show_params.filter((p) => keyMap[p]);
    const isCompact = this._config.display_mode === "compact";

    const rowLimit = isCompact
      ? (isHourly ? 12 : 5)
      : (isHourly ? 24 : data.length);
    const rows = (isHourly ? data.slice(0, 24) : data).slice(0, rowLimit);

    const headerCells = params.map((p) => {
      const meta = PARAM_META[p] || { label: p, unit: "", desc: "", icon: "" };
      const label = isCompact && meta.label.length > 6 ? meta.label.slice(0, 6) : meta.label;
      const unitStr = meta.unit ? ` (${meta.unit})` : "";
      const tooltip = meta.desc
        ? `${meta.label}${unitStr} — ${meta.desc}`
        : `${meta.label}${unitStr}`;
      return `<th data-tooltip="${escapeTitle(tooltip)}">${meta.icon}<span class="th-label">${label}</span></th>`;
    }).join("");

    const bodyRows = rows.map((entry) => {
      const dt = new Date(entry.datetime);
      const timeStr = isHourly
        ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      const timeTooltip = dt.toLocaleString([], {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: isHourly ? "2-digit" : undefined, minute: isHourly ? "2-digit" : undefined,
      });

      const condIcon = entry.condition ? (CONDITION_ICONS[entry.condition] || "") : "";

      const cells = params.map((p) => {
        const dataKey = keyMap[p];
        const val = entry[dataKey];
        const meta = PARAM_META[p] || { label: p, unit: "", desc: "" };
        const displayVal = fmt(val, meta.unit);
        const unitStr = meta.unit && meta.unit !== "°" ? ` ${meta.unit}` : "";
        const valuePart = val != null && val !== undefined
          ? `${meta.label}: ${displayVal}${unitStr}`
          : meta.label;
        const tooltip = meta.desc
          ? `${valuePart} — ${meta.desc}`
          : valuePart;
        return `<td data-tooltip="${escapeTitle(tooltip)}">${displayVal}</td>`;
      }).join("");

      return `<tr><td class="time-cell" data-tooltip="${escapeTitle(timeTooltip)}">${condIcon} ${timeStr}</td>${cells}</tr>`;
    }).join("");

    const timeHeaderTitle = isHourly
      ? "Forecast time (local)"
      : "Forecast date (local)";

    return `
      <div class="forecast-table-wrap">
        <table class="forecast-table">
          <thead><tr><th data-tooltip="${escapeTitle(timeHeaderTitle)}">Time</th>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    `;
  }
}
