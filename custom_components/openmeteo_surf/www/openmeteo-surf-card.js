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

// ── Human labels & icons ────────────────────────────────────────────
const PARAM_META = {
  // hourly
  wave_height: { label: "Waves", unit: "m", icon: "🌊" },
  wave_period: { label: "Period", unit: "s", icon: "⏱️" },
  wave_direction: { label: "Wave Dir", unit: "°", icon: "🧭" },
  swell_wave_height: { label: "Swell", unit: "m", icon: "🌊" },
  swell_wave_period: { label: "Swell Per", unit: "s", icon: "⏱️" },
  swell_wave_direction: { label: "Swell Dir", unit: "°", icon: "🧭" },
  sea_surface_temperature: { label: "Water", unit: "°C", icon: "🌡️" },
  temperature: { label: "Air", unit: "°C", icon: "🌡️" },
  wind_speed: { label: "Wind", unit: "km/h", icon: "💨" },
  wind_direction: { label: "Wind Dir", unit: "°", icon: "🧭" },
  precipitation: { label: "Rain", unit: "mm", icon: "🌧️" },
  // daily aliases
  wave_height_max: { label: "Max Waves", unit: "m", icon: "🌊" },
  wave_period_max: { label: "Max Period", unit: "s", icon: "⏱️" },
  wave_direction_dominant: { label: "Wave Dir", unit: "°", icon: "🧭" },
  swell_wave_height_max: { label: "Max Swell", unit: "m", icon: "🌊" },
  swell_wave_period_max: { label: "Max Swell Per", unit: "s", icon: "⏱️" },
  temperature_max: { label: "Max Temp", unit: "°C", icon: "🌡️" },
  temperature_min: { label: "Min Temp", unit: "°C", icon: "🌡️" },
  wind_speed_max: { label: "Max Wind", unit: "km/h", icon: "💨" },
  precipitation_sum: { label: "Total Rain", unit: "mm", icon: "🌧️" },
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
  }

  // ── Lifecycle ────────────────────────────────────────────────────
  setConfig(config) {
    if (!config.entity) throw new Error("Please define an 'entity' (weather entity ID)");
    this._config = {
      entity: config.entity,
      forecast_type: config.forecast_type || "both",
      show_params: config.show_params || DEFAULT_SHOW_PARAMS,
      title: config.title || null,
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
    return { entity: "", forecast_type: "both", show_params: DEFAULT_SHOW_PARAMS };
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
      <ha-card>
        <div class="card-header">
          <span class="title">${condIcon} ${title}</span>
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
  }

  // ── Current conditions ───────────────────────────────────────────
  _renderCurrent(stateObj, attrs) {
    const temp = attrs.temperature != null ? `${attrs.temperature}°` : "–";
    const wind = attrs.wind_speed != null ? `${attrs.wind_speed} km/h` : "–";
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
      const meta = PARAM_META[p] || { label: p, icon: "" };
      return `<th title="${meta.label}">${meta.icon}<span class="th-label">${meta.label}</span></th>`;
    }).join("");

    const bodyRows = rows.map((entry) => {
      const dt = new Date(entry.datetime);
      const timeStr = isHourly
        ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

      const condIcon = entry.condition ? (CONDITION_ICONS[entry.condition] || "") : "";

      const cells = params.map((p) => {
        const dataKey = keyMap[p];
        const val = entry[dataKey];
        const meta = PARAM_META[p] || { unit: "" };
        return `<td>${fmt(val, meta.unit)}</td>`;
      }).join("");

      return `<tr><td class="time-cell">${condIcon} ${timeStr}</td>${cells}</tr>`;
    }).join("");

    return `
      <div class="forecast-table-wrap">
        <table class="forecast-table">
          <thead><tr><th>Time</th>${headerCells}</tr></thead>
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
        font-size: 1.1em;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .card-content { padding: 0; }

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
    const entityVal = this._config.entity || "";
    const ftVal = this._config.forecast_type || "both";
    const paramsVal = (this._config.show_params || DEFAULT_SHOW_PARAMS).join(", ");
    const titleVal = this._config.title || "";

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
      </style>
      <div class="editor">
        <label>Entity (weather.*)</label>
        <input id="entity" value="${entityVal}" placeholder="weather.pipeline" />

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
      </div>
    `;

    ["entity", "title", "forecast_type", "show_params"].forEach((id) => {
      const el = this.shadowRoot.getElementById(id);
      el.addEventListener("change", () => this._onChange());
      el.addEventListener("input", () => this._onChange());
    });
  }

  _onChange() {
    const entity = this.shadowRoot.getElementById("entity").value.trim();
    const title = this.shadowRoot.getElementById("title").value.trim();
    const ft = this.shadowRoot.getElementById("forecast_type").value;
    const paramsRaw = this.shadowRoot.getElementById("show_params").value;
    const show_params = paramsRaw.split(",").map((s) => s.trim()).filter(Boolean);

    this._config = { ...this._config, entity, forecast_type: ft, show_params };
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
