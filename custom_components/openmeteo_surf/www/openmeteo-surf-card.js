/**
 * Open-Meteo Surf Card — Entry point
 *
 * Custom Lovelace card for Home Assistant.
 * Displays current surf conditions and hourly/daily forecasts.
 */

const CARD_VERSION = "1.0.0";

import { OpenMeteoSurfCard } from "./card/surf-card.js";
import { OpenMeteoSurfCardEditor } from "./card/surf-card-editor.js";

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
