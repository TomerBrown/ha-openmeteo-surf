/**
 * Open-Meteo Surf Card — Styles
 * Returns CSS string with display mode, theme vars, and config overrides.
 */

export function getStyles(displayMode = "normal", config = {}) {
  const primary = config.primary_color || "var(--primary-color, #0ea5e9)";
  const primaryDark = config.primary_color || "var(--dark-primary-color, var(--primary-color, #0284c7))";
  const borderRadius = config.border_radius != null ? config.border_radius : "var(--ha-card-border-radius, 12px)";

  return `
    :host {
      --surf-primary: ${primary};
      --surf-primary-dark: ${primaryDark};
      --surf-bg: var(--ha-card-background, var(--card-background-color, #fff));
      --surf-text: var(--primary-text-color, #1e293b);
      --surf-text-secondary: var(--secondary-text-color, #64748b);
      --surf-border: var(--divider-color, #e2e8f0);
      --surf-hover: color-mix(in srgb, var(--surf-primary) 6%, transparent);
    }

    ha-card {
      overflow: hidden;
      font-family: var(--ha-card-font-family, 'Segoe UI', system-ui, sans-serif);
      border-radius: ${typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius};
    }

    .card-header {
      background: linear-gradient(135deg, var(--surf-primary) 0%, var(--surf-primary-dark) 100%);
      color: var(--header-text-color, #fff);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .card-header .title {
      flex: 1;
      min-width: 0;
      font-size: clamp(0.9em, 2.5vw, 1.1em);
      font-weight: 600;
      letter-spacing: 0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      flex-shrink: 0;
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
      margin-right: 0;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      background: #fff;
      flex-shrink: 0;
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
    .card-content.no-watermark::before {
      display: none;
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
      font-size: clamp(0.85em, 2.5vw, 1.05em);
      font-weight: 700;
      color: var(--surf-text);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stat-card.primary .stat-value { color: var(--surf-primary); }
    .stat-label {
      font-size: 0.72em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--surf-text-secondary);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Display mode: compact ── */
    [data-display-mode="compact"] .card-header {
      padding: 10px 14px;
    }
    [data-display-mode="compact"] .card-header .title {
      font-size: 0.9em;
    }
    [data-display-mode="compact"] .header-logo {
      height: 22px;
      width: 22px;
    }
    [data-display-mode="compact"] .current-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    [data-display-mode="compact"] .stat-card {
      padding: 8px 6px;
    }
    [data-display-mode="compact"] .stat-icon {
      font-size: 1em;
    }
    [data-display-mode="compact"] .stat-value {
      font-size: 0.85em;
    }
    [data-display-mode="compact"] .stat-label {
      font-size: 0.65em;
    }
    [data-display-mode="compact"] .stat-label.hide-in-compact {
      display: none;
    }
    [data-display-mode="compact"] .tab-btn {
      padding: 8px;
      font-size: 0.8em;
    }
    [data-display-mode="compact"] .forecast-table-wrap {
      max-height: min(200px, 35vh);
    }
    [data-display-mode="compact"] .forecast-table {
      font-size: 0.75em;
    }
    [data-display-mode="compact"] .forecast-table th,
    [data-display-mode="compact"] .forecast-table td {
      padding: 5px 4px;
    }

    /* ── Display mode: elaborated ── */
    [data-display-mode="elaborated"] .card-header {
      padding: 18px 24px;
    }
    [data-display-mode="elaborated"] .card-header .title {
      font-size: 1.15em;
    }
    [data-display-mode="elaborated"] .header-logo {
      height: 32px;
      width: 32px;
    }
    [data-display-mode="elaborated"] .stat-card {
      padding: 14px 12px;
    }
    [data-display-mode="elaborated"] .stat-icon {
      font-size: 1.35em;
    }
    [data-display-mode="elaborated"] .stat-value {
      font-size: 1.1em;
    }
    [data-display-mode="elaborated"] .stat-label {
      font-size: 0.78em;
    }
    [data-display-mode="elaborated"] .tab-btn {
      padding: 12px;
      font-size: 0.9em;
    }
    [data-display-mode="elaborated"] .forecast-table-wrap {
      max-height: min(300px, 45vh);
    }
    [data-display-mode="elaborated"] .forecast-table {
      font-size: 0.9em;
    }
    [data-display-mode="elaborated"] .forecast-table th,
    [data-display-mode="elaborated"] .forecast-table td {
      padding: 9px 8px;
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
      max-height: min(250px, 40vh);
      -webkit-overflow-scrolling: touch;
    }
    .forecast-table {
      width: 100%;
      border-collapse: collapse;
      font-size: clamp(0.75em, 2vw, 0.88em);
      white-space: nowrap;
    }
    .surf-tooltip {
      position: fixed;
      padding: 8px 12px;
      background: var(--surf-tooltip-bg, rgba(15, 23, 42, 0.95));
      color: var(--surf-tooltip-text, #fff);
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
    .surf-tooltip.theme-style {
      --surf-tooltip-bg: var(--ha-card-background, var(--card-background-color, #1e293b));
      --surf-tooltip-text: var(--primary-text-color, #fff);
      border: 1px solid var(--divider-color, #e2e8f0);
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
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
    }
    .forecast-table tbody tr:hover {
      background: var(--surf-hover);
    }
    .time-cell {
      text-align: left !important;
      font-weight: 500;
      padding-left: 12px !important;
      color: var(--surf-text);
      max-width: none;
    }

    .no-data {
      padding: 24px;
      text-align: center;
      color: var(--surf-text-secondary);
      font-style: italic;
    }

    /* ── Responsive breakpoints ── */
    @media (max-width: 360px) {
      .card-header { padding: 10px 12px; }
      .card-header .title { font-size: 0.85em; }
      .current-grid { grid-template-columns: repeat(2, 1fr); }
      .stat-card { padding: 8px 6px; }
      .stat-value { font-size: 0.85em; }
      .stat-label { font-size: 0.65em; }
    }
    @media (max-width: 400px) {
      .current-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .forecast-table { font-size: 0.78em; }
      .forecast-table th {
        position: sticky;
        left: 0;
        z-index: 1;
      }
    }
    @media (min-width: 900px) {
      .forecast-table-wrap {
        max-height: min(280px, 42vh);
      }
    }
  `;
}
