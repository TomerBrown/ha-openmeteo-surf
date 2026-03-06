"""Tests for the Open-Meteo Surf API client."""
import re

import aiohttp
import pytest
from aioresponses import aioresponses

from custom_components.openmeteo_surf.api import OpenMeteoSurfApiClient
from custom_components.openmeteo_surf.const import FORECAST_API_URL, MARINE_API_URL

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession


# ── Mock API responses ──────────────────────────────────────────────
# Each API call now returns current + hourly + daily in one response.

MOCK_MARINE_RESPONSE = {
    "current": {
        "wave_height": 1.5,
        "wave_period": 8.0,
        "wave_direction": 270,
        "swell_wave_height": 1.2,
        "swell_wave_period": 10.0,
        "swell_wave_direction": 260,
        "sea_surface_temperature": 18.5,
    },
    "hourly": {
        "time": ["2026-03-06T00:00", "2026-03-06T01:00", "2026-03-06T02:00"],
        "wave_height": [1.5, 1.6, 1.7],
        "wave_period": [8.0, 8.1, 8.2],
        "wave_direction": [270, 272, 275],
        "swell_wave_height": [1.2, 1.3, 1.4],
        "swell_wave_period": [10.0, 10.1, 10.2],
        "swell_wave_direction": [260, 262, 264],
        "sea_surface_temperature": [18.5, 18.5, 18.4],
    },
    "daily": {
        "time": ["2026-03-06", "2026-03-07"],
        "wave_height_max": [1.9, 2.1],
        "wave_period_max": [9.0, 9.5],
        "wave_direction_dominant": [270, 265],
        "swell_wave_height_max": [1.5, 1.7],
        "swell_wave_period_max": [11.0, 11.5],
    },
}

MOCK_ATMO_RESPONSE = {
    "current": {
        "temperature_2m": 22.0,
        "precipitation": 0.0,
        "wind_speed_10m": 15.0,
        "wind_direction_10m": 280,
        "wind_gusts_10m": 25.0,
        "weather_code": 2,
    },
    "hourly": {
        "time": ["2026-03-06T00:00", "2026-03-06T01:00", "2026-03-06T02:00"],
        "temperature_2m": [22.0, 21.5, 21.0],
        "precipitation": [0.0, 0.0, 0.1],
        "wind_speed_10m": [15.0, 14.0, 13.0],
        "wind_direction_10m": [280, 282, 285],
        "wind_gusts_10m": [25.0, 24.0, 23.0],
        "weather_code": [2, 2, 3],
    },
    "daily": {
        "time": ["2026-03-06", "2026-03-07"],
        "temperature_2m_max": [25.0, 24.0],
        "temperature_2m_min": [18.0, 17.0],
        "precipitation_sum": [0.1, 1.2],
        "wind_speed_10m_max": [20.0, 22.0],
        "wind_gusts_10m_max": [30.0, 35.0],
        "weather_code": [2, 61],
    },
}

# Regex patterns to match any request to these base URLs
MARINE_RE = re.compile(r"^https://marine-api\.open-meteo\.com/v1/marine\b")
FORECAST_RE = re.compile(r"^https://api\.open-meteo\.com/v1/forecast\b")


def _register_mocks(m):
    """Register API call mocks. Two calls: one marine, one atmospheric."""
    m.get(MARINE_RE, payload=MOCK_MARINE_RESPONSE)
    m.get(FORECAST_RE, payload=MOCK_ATMO_RESPONSE)


# ── Tests ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_api_get_data(hass: HomeAssistant):
    """Test API returns current + forecast data with correct structure."""
    session = async_get_clientsession(hass)
    client = OpenMeteoSurfApiClient(latitude=52.52, longitude=13.41, session=session)

    with aioresponses() as m:
        _register_mocks(m)
        data = await client.async_get_data()

        # Structure check
        assert "current" in data
        assert "hourly" in data
        assert "daily" in data

        # Current data
        assert data["current"]["wave_height"] == 1.5
        assert data["current"]["swell_wave_height"] == 1.2
        assert data["current"]["wind_speed_10m"] == 15.0
        assert data["current"]["temperature_2m"] == 22.0
        assert data["current"]["sea_surface_temperature"] == 18.5
        assert data["current"]["weather_code"] == 2


@pytest.mark.asyncio
async def test_api_forecast_hourly(hass: HomeAssistant):
    """Test hourly forecast data is correctly merged."""
    session = async_get_clientsession(hass)
    client = OpenMeteoSurfApiClient(latitude=52.52, longitude=13.41, session=session)

    with aioresponses() as m:
        _register_mocks(m)
        data = await client.async_get_data()

        hourly = data["hourly"]
        assert len(hourly) == 3

        assert hourly[0]["datetime"] == "2026-03-06T00:00"
        assert hourly[0]["wave_height"] == 1.5
        assert hourly[0]["temperature_2m"] == 22.0
        assert hourly[0]["wind_speed_10m"] == 15.0

        assert hourly[1]["wave_height"] == 1.6
        assert hourly[1]["temperature_2m"] == 21.5

        assert hourly[2]["wave_height"] == 1.7
        assert hourly[2]["weather_code"] == 3


@pytest.mark.asyncio
async def test_api_forecast_daily(hass: HomeAssistant):
    """Test daily forecast data is correctly merged."""
    session = async_get_clientsession(hass)
    client = OpenMeteoSurfApiClient(latitude=52.52, longitude=13.41, session=session)

    with aioresponses() as m:
        _register_mocks(m)
        data = await client.async_get_data()

        daily = data["daily"]
        assert len(daily) == 2

        assert daily[0]["datetime"] == "2026-03-06"
        assert daily[0]["wave_height_max"] == 1.9
        assert daily[0]["temperature_2m_max"] == 25.0
        assert daily[0]["temperature_2m_min"] == 18.0
        assert daily[0]["precipitation_sum"] == 0.1

        assert daily[1]["wave_height_max"] == 2.1
        assert daily[1]["weather_code"] == 61
