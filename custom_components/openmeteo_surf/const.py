"""Constants for the Open-Meteo Surf integration."""

from logging import Logger, getLogger

LOGGER: Logger = getLogger(__package__)

DOMAIN = "openmeteo_surf"
CONF_UPDATE_INTERVAL = "update_interval"
DEFAULT_UPDATE_INTERVAL = 60  # Default 60 minutes

CONF_LATITUDE = "latitude"
CONF_LONGITUDE = "longitude"
CONF_NAME = "name"
CONF_TIMEZONE = "timezone"

UPDATE_INTERVAL_OPTIONS = [5, 10, 30, 60, 120, 360]

MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine"
FORECAST_API_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather interpretation codes → Home Assistant condition strings
# https://open-meteo.com/en/docs → WMO Weather interpretation codes (WW)
WMO_TO_HA_CONDITION: dict[int, str] = {
    0: "sunny",           # Clear sky
    1: "sunny",           # Mainly clear
    2: "partlycloudy",    # Partly cloudy
    3: "cloudy",          # Overcast
    45: "fog",            # Fog
    48: "fog",            # Depositing rime fog
    51: "rainy",          # Drizzle: Light
    53: "rainy",          # Drizzle: Moderate
    55: "rainy",          # Drizzle: Dense
    56: "rainy",          # Freezing Drizzle: Light
    57: "rainy",          # Freezing Drizzle: Dense
    61: "rainy",          # Rain: Slight
    63: "rainy",          # Rain: Moderate
    65: "pouring",        # Rain: Heavy
    66: "rainy",          # Freezing Rain: Light
    67: "pouring",        # Freezing Rain: Heavy
    71: "snowy",          # Snow fall: Slight
    73: "snowy",          # Snow fall: Moderate
    75: "snowy",          # Snow fall: Heavy
    77: "snowy",          # Snow grains
    80: "rainy",          # Rain showers: Slight
    81: "rainy",          # Rain showers: Moderate
    82: "pouring",        # Rain showers: Violent
    85: "snowy",          # Snow showers: Slight
    86: "snowy",          # Snow showers: Heavy
    95: "lightning-rainy", # Thunderstorm: Slight/moderate
    96: "lightning-rainy", # Thunderstorm with slight hail
    99: "lightning-rainy", # Thunderstorm with heavy hail
}
