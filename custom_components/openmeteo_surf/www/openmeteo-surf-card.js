/**
 * Open-Meteo Surf Card — Custom Lovelace card for Home Assistant
 *
 * Displays current surf conditions and hourly/daily forecasts from
 * the openmeteo_surf weather entity.
 *
 * Config:
 *   entity:        weather.* entity ID (required)
 *   forecast_type: "hourly" | "daily" | "both" (default: "both")
 *   show_params:   list of param keys to show in forecast tables
 *   title:         card title override
 */

const CARD_VERSION = "1.0.0";

// ── Default config ──────────────────────────────────────────────────
const DEFAULT_SHOW_PARAMS = [
  "wave_height",
  "wave_period",
  "wave_direction",
  "swell_wave_height",
  "wind_speed",
  "wind_direction",
  "temperature",
];

// ── Human labels, units, descriptions & icons ───────────────────────
const PARAM_META = {
  // hourly
  wave_height: { label: "Waves", unit: "m", icon: "🌊", desc: "Significant wave height (average of highest 1/3 of waves)" },
  wave_period: { label: "Period", unit: "s", icon: "⏱️", desc: "Dominant wave period (time between wave crests)" },
  wave_direction: { label: "Wave Dir", unit: "°", icon: "🧭", desc: "Direction waves are coming from (0° = N, 90° = E)" },
  swell_wave_height: { label: "Swell", unit: "m", icon: "🌊", desc: "Swell wave height (waves from distant storms)" },
  swell_wave_period: { label: "Swell Per", unit: "s", icon: "⏱️", desc: "Swell wave period" },
  swell_wave_direction: { label: "Swell Dir", unit: "°", icon: "🧭", desc: "Direction swell is coming from" },
  sea_surface_temperature: { label: "Water", unit: "°C", icon: "🌡️", desc: "Sea surface temperature" },
  temperature: { label: "Air", unit: "°C", icon: "🌡️", desc: "Air temperature at 2 m height" },
  wind_speed: { label: "Wind", unit: "kt", icon: "💨", desc: "Wind speed at 10 m height (knots)" },
  wind_direction: { label: "Wind Dir", unit: "°", icon: "🧭", desc: "Wind direction (where wind is coming from)" },
  precipitation: { label: "Rain", unit: "mm", icon: "🌧️", desc: "Precipitation (rain + snow) in the period" },
  // daily aliases
  wave_height_max: { label: "Max Waves", unit: "m", icon: "🌊", desc: "Maximum significant wave height for the day" },
  wave_period_max: { label: "Max Period", unit: "s", icon: "⏱️", desc: "Maximum wave period for the day" },
  wave_direction_dominant: { label: "Wave Dir", unit: "°", icon: "🧭", desc: "Dominant wave direction for the day" },
  swell_wave_height_max: { label: "Max Swell", unit: "m", icon: "🌊", desc: "Maximum swell height for the day" },
  swell_wave_period_max: { label: "Max Swell Per", unit: "s", icon: "⏱️", desc: "Maximum swell period for the day" },
  temperature_max: { label: "Max Temp", unit: "°C", icon: "🌡️", desc: "Maximum air temperature" },
  temperature_min: { label: "Min Temp", unit: "°C", icon: "🌡️", desc: "Minimum air temperature" },
  wind_speed_max: { label: "Max Wind", unit: "kt", icon: "💨", desc: "Maximum wind speed for the day (knots)" },
  precipitation_sum: { label: "Total Rain", unit: "mm", icon: "🌧️", desc: "Total precipitation for the day" },
};

// Map hourly show_param keys → actual forecast data keys
const HOURLY_KEY_MAP = {
  wave_height: "native_wave_height",
  wave_period: "native_wave_period",
  wave_direction: "native_wave_direction",
  swell_wave_height: "native_swell_wave_height",
  swell_wave_period: "native_swell_wave_period",
  swell_wave_direction: "native_swell_wave_direction",
  sea_surface_temperature: "native_sea_surface_temperature",
  temperature: "temperature",
  wind_speed: "wind_speed",
  wind_direction: "wind_bearing",
  precipitation: "precipitation",
};

const DAILY_KEY_MAP = {
  wave_height: "native_wave_height_max",
  wave_height_max: "native_wave_height_max",
  wave_period: "native_wave_period_max",
  wave_period_max: "native_wave_period_max",
  wave_direction: "native_wave_direction_dominant",
  wave_direction_dominant: "native_wave_direction_dominant",
  swell_wave_height: "native_swell_wave_height_max",
  swell_wave_height_max: "native_swell_wave_height_max",
  swell_wave_period: "native_swell_wave_period_max",
  swell_wave_period_max: "native_swell_wave_period_max",
  temperature: "temperature",
  temperature_max: "temperature",
  temperature_min: "templow",
  wind_speed: "wind_speed",
  wind_speed_max: "wind_speed",
  precipitation: "precipitation",
  precipitation_sum: "precipitation",
  wind_direction: "wind_bearing",
};

// ── Condition icons ─────────────────────────────────────────────────
const CONDITION_ICONS = {
  "sunny": "☀️",
  "partlycloudy": "⛅",
  "cloudy": "☁️",
  "fog": "🌫️",
  "rainy": "🌧️",
  "pouring": "🌧️",
  "snowy": "🌨️",
  "lightning-rainy": "⛈️",
  "exceptional": "⚠️",
};

// Degree → compass label
function degToCompass(deg) {
  if (deg == null) return "–";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Format value for display
function fmt(val, unit) {
  if (val == null || val === undefined) return "–";
  if (unit === "°") return `${Math.round(val)}° ${degToCompass(val)}`;
  if (typeof val === "number") return Number.isInteger(val) ? val : val.toFixed(1);
  return val;
}

// Escape for HTML title attribute
function escapeTitle(s) {
  if (!s) return "";
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Card class ──────────────────────────────────────────────────────
class OpenMeteoSurfCard extends HTMLElement {
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

  // ── Lifecycle ────────────────────────────────────────────────────
  setConfig(config) {
    if (!config.entity) throw new Error("Please define an 'entity' (weather entity ID)");
    this._config = {
      entity: config.entity,
      forecast_type: config.forecast_type || "both",
      show_params: config.show_params || DEFAULT_SHOW_PARAMS,
      title: config.title || null,
      show_refresh_button: config.show_refresh_button !== false,
      show_refresh_text: config.show_refresh_text !== false,
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
    };
  }

  // ── Editor ───────────────────────────────────────────────────────
  static getConfigElement() {
    return document.createElement("openmeteo-surf-card-editor");
  }

  // ── Render ───────────────────────────────────────────────────────
  _render() {
    if (!this._hass || !this._config.entity) return;
    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding:16px">Entity not found: ${this._config.entity}</div></ha-card>`;
      return;
    }
    const attrs = stateObj.attributes;
    const title = this._config.title || attrs.friendly_name || "Surf Forecast";
    const condIcon = CONDITION_ICONS[stateObj.state] || "🌊";

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <div id="surf-tooltip" class="surf-tooltip"></div>
      <ha-card>
        <div class="card-header">
          <img src="/openmeteo_surf/icon.png" class="header-logo" />
          <span class="title">${condIcon} ${title}</span>
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

    // Bind tab clicks
    this.shadowRoot.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._activeTab = btn.dataset.tab;
        this._render();
      });
    });

    // Bind refresh button
    const refreshBtn = this.shadowRoot.getElementById("refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this._refresh());
    }

    // Bind tooltip hover for forecast table
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

  // ── Current conditions ───────────────────────────────────────────
  _renderCurrent(stateObj, attrs) {
    const temp = attrs.temperature != null ? `${attrs.temperature}°` : "–";
    const wind = attrs.wind_speed != null ? `${attrs.wind_speed} kt` : "–";
    const waveH = attrs.wave_height != null ? `${attrs.wave_height} m` : "–";
    const swellH = attrs.swell_wave_height != null ? `${attrs.swell_wave_height} m` : "–";
    const wavePer = attrs.wave_period != null ? `${attrs.wave_period}s` : "–";
    const waveDir = attrs.wave_direction != null ? `${Math.round(attrs.wave_direction)}° ${degToCompass(attrs.wave_direction)}` : "–";
    const waterTemp = attrs.sea_surface_temperature != null ? `${attrs.sea_surface_temperature}°C` : "–";
    const windDir = attrs.wind_bearing != null ? degToCompass(attrs.wind_bearing) : "–";

    return `
      <div class="current-grid">
        <div class="stat-card primary">
          <div class="stat-icon">🌊</div>
          <div class="stat-value">${waveH}</div>
          <div class="stat-label">Wave Height</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">${wavePer}</div>
          <div class="stat-label">Period</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🧭</div>
          <div class="stat-value">${waveDir}</div>
          <div class="stat-label">Wave Dir</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌊</div>
          <div class="stat-value">${swellH}</div>
          <div class="stat-label">Swell</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💨</div>
          <div class="stat-value">${wind} ${windDir}</div>
          <div class="stat-label">Wind</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌡️</div>
          <div class="stat-value">${temp} / ${waterTemp}</div>
          <div class="stat-label">Air / Water</div>
        </div>
      </div>
    `;
  }

  // ── Tab bar ──────────────────────────────────────────────────────
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

  // ── Forecast table ───────────────────────────────────────────────
  _renderForecastTable() {
    const tab = this._activeTab || "hourly";
    const data = this._forecasts[tab];

    if (!data || data.length === 0) {
      return `<div class="no-data">Loading ${tab} forecast…</div>`;
    }

    const isHourly = tab === "hourly";
    const keyMap = isHourly ? HOURLY_KEY_MAP : DAILY_KEY_MAP;
    const params = this._config.show_params.filter((p) => keyMap[p]);

    // For hourly, show next 24 h; for daily, show all (usually 7 days)
    const rows = isHourly ? data.slice(0, 24) : data;

    const headerCells = params.map((p) => {
      const meta = PARAM_META[p] || { label: p, unit: "", desc: "", icon: "" };
      const unitStr = meta.unit ? ` (${meta.unit})` : "";
      const tooltip = meta.desc
        ? `${meta.label}${unitStr} — ${meta.desc}`
        : `${meta.label}${unitStr}`;
      return `<th data-tooltip="${escapeTitle(tooltip)}">${meta.icon}<span class="th-label">${meta.label}</span></th>`;
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
        // Don't append unit for "°" since fmt() already includes it in direction values
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

  // ── Styles ───────────────────────────────────────────────────────
  _styles() {
    return `
      :host {
        --surf-primary: #0ea5e9;
        --surf-primary-dark: #0284c7;
        --surf-bg: var(--ha-card-background, var(--card-background-color, #fff));
        --surf-text: var(--primary-text-color, #1e293b);
        --surf-text-secondary: var(--secondary-text-color, #64748b);
        --surf-border: var(--divider-color, #e2e8f0);
        --surf-hover: rgba(14,165,233,0.06);
      }

      ha-card {
        overflow: hidden;
        font-family: var(--ha-card-font-family, 'Segoe UI', system-ui, sans-serif);
      }

      .card-header {
        background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
        color: #fff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
      }
      .card-header .title {
        flex: 1;
        font-size: 1.1em;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 36px;
        height: 36px;
        padding: 0 10px;
        border: none;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        font-size: 0.85em;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      .refresh-btn.with-text {
        padding: 0 14px;
      }
      .refresh-btn .refresh-label {
        white-space: nowrap;
      }
      .refresh-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.35);
      }
      .refresh-btn:disabled {
        cursor: default;
        opacity: 0.8;
      }
      .refresh-icon {
        display: inline-block;
        font-size: 1.1em;
        line-height: 1;
      }
      .refresh-icon.spinning {
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .header-logo {
        height: 28px;
        width: 28px;
        margin-right: 12px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.2);
        background: #fff;
      }

      .card-content { padding: 0; position: relative; }
      .card-content::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150px;
        height: 150px;
        background-image: url("/openmeteo_surf/icon.png");
        background-size: contain;
        background-repeat: no-repeat;
        opacity: 0.03;
        pointer-events: none;
      }

      /* ── Current grid ── */
      .current-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: var(--surf-border);
        border-bottom: 1px solid var(--surf-border);
      }
      .stat-card {
        background: var(--surf-bg);
        padding: 12px 10px;
        text-align: center;
      }
      .stat-icon { font-size: 1.2em; margin-bottom: 2px; }
      .stat-value {
        font-size: 1.05em;
        font-weight: 700;
        color: var(--surf-text);
        line-height: 1.3;
      }
      .stat-card.primary .stat-value { color: var(--surf-primary-dark); }
      .stat-label {
        font-size: 0.72em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--surf-text-secondary);
        margin-top: 2px;
      }

      /* ── Tabs ── */
      .tab-bar {
        display: flex;
        border-bottom: 1px solid var(--surf-border);
      }
      .tab-btn {
        flex: 1;
        padding: 10px;
        border: none;
        background: var(--surf-bg);
        color: var(--surf-text-secondary);
        font-size: 0.85em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      .tab-btn:hover { background: var(--surf-hover); }
      .tab-btn.active {
        color: var(--surf-primary);
        border-bottom-color: var(--surf-primary);
        font-weight: 600;
      }

      /* ── Forecast table ── */
      .forecast-table-wrap {
        overflow-x: auto;
        overflow-y: auto;
        max-height: 250px;
        -webkit-overflow-scrolling: touch;
      }
      .forecast-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82em;
        white-space: nowrap;
      }
      .surf-tooltip {
        position: fixed;
        padding: 8px 12px;
        background: rgba(15, 23, 42, 0.95);
        color: #fff;
        font-size: 0.78em;
        font-weight: 400;
        line-height: 1.4;
        white-space: normal;
        max-width: 260px;
        border-radius: 6px;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s, visibility 0.15s;
      }
      .surf-tooltip.visible {
        opacity: 1;
        visibility: visible;
      }
      .forecast-table th {
        position: sticky;
        top: 0;
        background: var(--surf-bg);
        padding: 8px 6px;
        text-align: center;
        font-weight: 600;
        color: var(--surf-text-secondary);
        border-bottom: 2px solid var(--surf-border);
        font-size: 0.88em;
        cursor: help;
      }
      .forecast-table th .th-label {
        display: block;
        font-size: 0.8em;
        font-weight: 400;
      }
      .forecast-table td {
        padding: 7px 6px;
        text-align: center;
        border-bottom: 1px solid var(--surf-border);
        color: var(--surf-text);
        cursor: help;
      }
      .forecast-table tbody tr:hover {
        background: var(--surf-hover);
      }
      .time-cell {
        text-align: left !important;
        font-weight: 500;
        padding-left: 12px !important;
        color: var(--surf-text);
      }

      .no-data {
        padding: 24px;
        text-align: center;
        color: var(--surf-text-secondary);
        font-style: italic;
      }

      /* responsive */
      @media (max-width: 400px) {
        .current-grid { grid-template-columns: repeat(2, 1fr); }
      }
    `;
  }
}

// ── Card Editor ─────────────────────────────────────────────────────
class OpenMeteoSurfCardEditor extends HTMLElement {
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

    // Preserve focus when re-rendering (avoids input losing focus while typing)
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

    // Get all weather entities for the dropdown
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
        <input id="title" value="${titleVal}" placeholder="Auto from entity name" />

        <label>Forecast type</label>
        <select id="forecast_type">
          <option value="both"   ${ftVal === "both" ? "selected" : ""}>Both (hourly + daily)</option>
          <option value="hourly" ${ftVal === "hourly" ? "selected" : ""}>Hourly only</option>
          <option value="daily"  ${ftVal === "daily" ? "selected" : ""}>Daily only</option>
        </select>

        <label>Show parameters</label>
        <input id="show_params" value="${paramsVal}" />
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

    ["entity", "title", "forecast_type", "show_params", "show_refresh_button", "show_refresh_text"].forEach((id) => {
      const el = this.shadowRoot.getElementById(id);
      el.addEventListener("change", () => this._onChange());
      if (el.tagName === "INPUT") {
        el.addEventListener("input", () => this._onChange());
      }
    });

    // Restore focus to the element that had it (fixes typing-in-title losing focus)
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
    const entity = this.shadowRoot.getElementById("entity").value.trim();
    const title = this.shadowRoot.getElementById("title").value.trim();
    const ft = this.shadowRoot.getElementById("forecast_type").value;
    const paramsRaw = this.shadowRoot.getElementById("show_params").value;
    const show_params = paramsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const show_refresh_button = this.shadowRoot.getElementById("show_refresh_button")?.checked !== false;
    const show_refresh_text = this.shadowRoot.getElementById("show_refresh_text")?.checked !== false;

    this._config = { ...this._config, entity, forecast_type: ft, show_params, show_refresh_button, show_refresh_text };
    if (title) this._config.title = title;
    else delete this._config.title;

    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }
}

// ── Register ────────────────────────────────────────────────────────
customElements.define("openmeteo-surf-card", OpenMeteoSurfCard);
customElements.define("openmeteo-surf-card-editor", OpenMeteoSurfCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "openmeteo-surf-card",
  name: "Open-Meteo Surf Card",
  description: "Surf forecast card showing current conditions and hourly/daily marine & weather forecasts",
  preview: true,
  documentationURL: "https://github.com/tomerbrown/ha-openmeteo-surf",
});

console.info(`%c OPENMETEO-SURF-CARD %c v${CARD_VERSION} `, "background:#0ea5e9;color:#fff;font-weight:700;", "");
